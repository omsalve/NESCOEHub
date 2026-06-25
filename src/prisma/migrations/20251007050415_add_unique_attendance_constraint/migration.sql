/*
  Warnings:

  - A unique constraint covering the columns `[studentId,lectureId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_lectureId_key" ON "Attendance"("studentId", "lectureId");
