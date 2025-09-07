import type {
  PrismaClient,
  Room,
  RoomMember,
} from "../generated/prisma/index.js";

export type RoomWithMemberCount = Room & { memberCount: number };
export type RoomId = Pick<Room, "id">;
export type CreateRoomInput = Pick<Room, "name" | "ownerId">;

export async function getRoomById(
  prisma: PrismaClient,
  roomId: number
): Promise<Room | null> {
  try {
    return await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getRooms(
  prisma: PrismaClient
): Promise<RoomWithMemberCount[]> {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
      _count: {
        select: {
          RoomMember: true,
        },
      },
    },
  });

  return rooms.map(({ _count, ...rest }) => ({
    ...rest,
    memberCount: _count.RoomMember,
  }));
}

export async function insertRoom(
  prisma: PrismaClient,
  room: CreateRoomInput
): Promise<RoomId | null> {
  try {
    return await prisma.room.create({
      data: {
        RoomMember: {
          create: {
            userId: room.ownerId,
          },
        },
        ...room,
      },
      select: {
        id: true,
      },
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function insertRoomMember(
  prisma: PrismaClient,
  roomMember: RoomMember
): Promise<boolean> {
  try {
    return !!(await prisma.roomMember.create({
      data: roomMember,
    }));
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function deleteRoomMember(
  prisma: PrismaClient,
  { roomId, userId }: RoomMember
): Promise<boolean> {
  try {
    return !!(await prisma.roomMember.delete({
      where: {
        roomMemberIdentifier: { roomId, userId },
      },
    }));
  } catch (e) {
    console.error(e);
    return false;
  }
}
