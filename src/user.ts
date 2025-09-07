import * as argon2 from "argon2";
import {
  type PrismaClient,
  type User,
  Prisma,
} from "../generated/prisma/index.js";
import jwt, { type Secret } from "jsonwebtoken";

const SECRET_KEY: Secret = "secret-key";

export type CreateUserInput = Pick<User, "email" | "name" | "password">;
export type UserDetails = Pick<User, "id" | "email" | "name">;
export type LoginUserInput = Pick<User, "email" | "password">;

export async function createUser(
  prisma: PrismaClient,
  userData: CreateUserInput
): Promise<UserDetails | null> {
  if (!userData.email || !userData.name || !userData.password) {
    throw new Error("missing user data");
  }
  try {
    const hashedPassword = await argon2.hash(Buffer.from(userData.password));

    return await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: Buffer.from(hashedPassword),
      },
      select: { id: true, email: true, name: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const errorMsg =
          "There is a unique constraint violation, a new user cannot be created with this email";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    throw e;
  }
}

export async function getUserByEmail(
  prisma: PrismaClient,
  userEmail: string
): Promise<User | null> {
  return await prisma.user.findFirst({ where: { email: userEmail } });
}

export async function loginUser(
  prisma: PrismaClient,
  userData: LoginUserInput
): Promise<(UserDetails & { token: string }) | null> {
  const { email, password } = userData;

  try {
    const user = await getUserByEmail(prisma, email);
    if (!user) {
      throw new Error();
    }

    const isPasswordMatching = await argon2.verify(
      Buffer.from(user.password).toString(),
      Buffer.from(password)
    );

    if (!isPasswordMatching) {
      throw new Error();
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "2 days",
    });

    return { id: user.id, email, name: user.name, token };
  } catch (e) {
    console.error("Login failed: ", e);
    return null;
  }
}

export async function loginUserWithToken(
  prisma: PrismaClient,
  data: { token: string }
): Promise<(UserDetails & { token: string }) | null> {
  try {
    const { token } = data;
    const decoded = jwt.verify(token, SECRET_KEY) as {
      id: string;
      email: string;
      iat: number;
      exp: number;
    };

    const user = await getUserByEmail(prisma, decoded.email);

    if (!user) {
      throw new Error();
    }

    return { id: user.id, email: user.email, name: user.name, token };
  } catch (e) {
    console.error("Login failed: ", e);
    return null;
  }
}
