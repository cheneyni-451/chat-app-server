-- CreateTable
CREATE TABLE "public"."RoomMember" (
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "public"."RoomMember"("roomId", "userId");
