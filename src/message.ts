import type { Message, PrismaClient, User } from "../generated/prisma/index.js";

export type MessageDetail = Pick<
  Message,
  "id" | "content" | "createdAt" | "roomId"
> & { user: Pick<User, "id" | "name" | "email"> };

export type MessageInput = Pick<Message, "content" | "userId" | "roomId">;

export async function getMessages(
  prisma: PrismaClient,
  roomId: number
): Promise<MessageDetail[]> {
  try {
    const messages = await prisma.message.findMany({
      select: {
        id: true,
        content: true,
        userId: true,
        roomId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
      where: {
        roomId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages.map((message) => ({
      ...message,
      user: {
        id: message.userId,
        name: message.user.name,
        email: message.user.email,
      },
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function insertMessage(
  prisma: PrismaClient,
  message: MessageInput
): Promise<MessageDetail | null> {
  try {
    const createdMessage = await prisma.message.create({
      data: message,
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        roomId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!createdMessage) {
      return null;
    }

    return {
      ...createdMessage,
      user: {
        id: createdMessage.userId,
        name: createdMessage.user.name,
        email: createdMessage.user.email,
      },
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}
