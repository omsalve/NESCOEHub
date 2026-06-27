// src/prisma/seed.ts
/*
  Final rewritten seed.ts (Option A, exact timetable)
  - Faculty emails: firstinitial.lastname@nescoe.com
  - HOD placeholders: hod.<dept-key>@nescoe.com
  - Uses syllabus & timetable PDFs you uploaded (local paths below)

  Syllabus: /mnt/data/First-Year-B.Tech-syllabus-common-to-all-Branches_for_Affiliated-Institutes_as-per-NEP_w.e.f._2024-25 (1) (3).pdf
  Timetable: /mnt/data/Time Table  Bhandup 2025-26 Modified (3) (3).pdf
*/

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

interface StudentCSVRecord {
  'Course Name': string;
  'Candidate Name': string;
  'Application ID': string;
  'Mobile No'?: string;
  'CET Percentile'?: string;
  'JEE Percentile'?: string;
}

const parseCSV = (filePath: string): Promise<StudentCSVRecord[]> => {
  const csvFile = fs.readFileSync(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    Papa.parse<StudentCSVRecord>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: unknown) => reject(err),
    });
  });
};

const getLectureDate = (dayOfWeek: number, time: string): Date => {
  const firstMonday = new Date('2025-09-22T00:00:00.000Z');
  const lectureDate = new Date(firstMonday);
  lectureDate.setUTCDate(firstMonday.getUTCDate() + (dayOfWeek - 1));
  const [hours, minutes] = time.split(':').map(Number);
  lectureDate.setUTCHours(hours, minutes, 0, 0);
  return lectureDate;
};

const studentEmailFromName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '') + '@nescoe.com';

const facultyEmailFromName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
  const last = parts[parts.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
  return `${first[0]}.${last}@nescoe.com`;
};

const deptKeyFromName = (name: string) => {
  const mapping: Record<string, string> = {
    'Artificial Intelligence and Data Science': 'AI & Data Science',
    'AI & Data Science': 'AI & Data Science',
    'Computer Science and Engineering': 'Computer Science and Engineering',
    'Computer Engineering': 'Computer Engineering',
    'Information Technology': 'Information Technology',
    'Electrical Engineering': 'Electrical Engineering',
    'Electronics and Telecommunication Engg': 'Electronics and Telecommunication Engg',
    'Mechanical Engineering': 'Mechanical Engineering',
    'Civil Engineering': 'Civil Engineering',
    'Applied Sciences': 'Applied Sciences',
  };
  return mapping[name] ?? name;
};

const isGroupA = (deptName: string) => {
  const key = deptKeyFromName(deptName);
  return ['Computer Engineering', 'AI & Data Science', 'Electrical Engineering'].includes(key);
};
const isGroupB = (deptName: string) => {
  const key = deptKeyFromName(deptName);
  return ['Computer Science and Engineering', 'Information Technology', 'Electronics and Telecommunication Engg'].includes(key);
};

const parseNumericRoll = (rollRaw: string) => {
  const digits = rollRaw.match(/\d+/g)?.join('') ?? '';
  return digits ? parseInt(digits, 10) : NaN;
};
const batchFromRollAndGroup = (rollRaw: string, groupAorB: 'A' | 'B') => {
  const n = parseNumericRoll(rollRaw);
  if (isNaN(n)) return groupAorB + '1';
  return n <= 33 ? `${groupAorB}1` : `${groupAorB}2`;
};

async function main() {
  console.log('Seeding — final rewritten seed (Option A, exact timetable)');

  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.event.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const departmentNames = [
    'Computer Science and Engineering',
    'Computer Engineering',
    'Information Technology',
    'Electrical Engineering',
    'Electronics and Telecommunication Engg',
    'AI & Data Science',
    'Mechanical Engineering',
    'Civil Engineering',
    'Applied Sciences',
  ];

  const departmentMap: Record<string, { id: number; name: string }> = {};
  for (const d of departmentNames) {
    const rec = await prisma.department.create({ data: { name: d } });
    departmentMap[d] = { id: rec.id, name: rec.name };
  }

  for (const d of departmentNames) {
    const key = d.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const email = `hod.${key}@nescoe.com`;
    await prisma.user.create({ data: { name: `HOD - ${d}`, email, passwordHash: await bcrypt.hash('hodpassword', 10), role: Role.HOD, departmentId: departmentMap[d].id } });
  }

  const studentPassword = 'password123';
  const facultyPassword = 'teacherpass456';
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);
  const hashedFacultyPassword = await bcrypt.hash(facultyPassword, 10);

  const facultyList = [
    { name: 'Dr. D. F. Shastrakar', dept: 'Applied Sciences' },
    { name: 'Mr. Prasad Parab', dept: 'Applied Sciences' },
    { name: 'Mr. Pratap Singh', dept: 'Applied Sciences' },
    { name: 'Dr. Ajay Bhoir', dept: 'Applied Sciences' },
    { name: 'Smt. Rajeshree Chauhan', dept: 'Applied Sciences' },
    { name: 'Mr. S. M. Kamdi', dept: 'Applied Sciences' },
    { name: 'Er. Bhagyashri Thele', dept: 'Applied Sciences' },
    { name: 'Dr. M.S. Kimmatkar', dept: 'Applied Sciences' },
    { name: 'Mr. Amol Satam', dept: 'Electrical Engineering' },
    { name: 'Mrs. Deepali Y. Patil', dept: 'Applied Sciences' },
    { name: 'Mr. Mahesh Pimpalkar', dept: 'Applied Sciences' },
    { name: 'Mr. P. J. Bhoite', dept: 'Applied Sciences' },
  ];

  const facultyMap: Record<string, { id: number; email: string }> = {};
  for (const f of facultyList) {
    const email = facultyEmailFromName(f.name);
    const user = await prisma.user.create({ data: { name: f.name, email, passwordHash: hashedFacultyPassword, role: Role.PROFESSOR, departmentId: departmentMap[f.dept].id, faculty: { create: { designation: 'Professor' } } } });
    facultyMap[f.name] = { id: user.id, email: user.email };
  }

  await prisma.user.create({ data: { name: 'Principal NESCOE', email: 'principal@nescoe.com', passwordHash: hashedFacultyPassword, role: Role.PRINCIPAL } });

  const commonCourses = [
    { code: '24AF1000BS101', name: 'Engineering Mathematics – I', dept: 'Applied Sciences', faculty: 'Dr. D. F. Shastrakar' },
    { code: '24AF1CHEBS102', name: 'Engineering Chemistry', dept: 'Applied Sciences', faculty: 'Dr. Ajay Bhoir' },
    { code: '24AF1CHEBS103L', name: 'Engineering Chemistry Lab', dept: 'Applied Sciences', faculty: 'Smt. Rajeshree Chauhan' },
    { code: '24AF1EMES104', name: 'Engineering Mechanics', dept: 'Applied Sciences', faculty: 'Er. Bhagyashri Thele' },
    { code: '24AF1EMES105L', name: 'Engineering Mechanics Lab', dept: 'Applied Sciences', faculty: 'Er. Bhagyashri Thele' },
    { code: '24AF1000ES106', name: 'Programming for Problem Solving', dept: 'Applied Sciences', faculty: 'Mr. Mahesh Pimpalkar' },
    { code: '24AF1000ES107L', name: 'Programming for Problem Solving Lab', dept: 'Applied Sciences', faculty: 'Mr. Mahesh Pimpalkar' },
    { code: '24AF1000VS108L', name: 'Workshop Practices', dept: 'Applied Sciences', faculty: 'Mr. P. J. Bhoite' },
    { code: '24AF1000VS109', name: 'Communication Skills', dept: 'Applied Sciences', faculty: 'Mrs. Deepali Y. Patil' },
    { code: '24AF1000VS110L', name: 'Communication Skills Lab', dept: 'Applied Sciences', faculty: 'Mrs. Deepali Y. Patil' },
    { code: '24AF1000CC111', name: 'CC (Co-curricular)', dept: 'Applied Sciences', faculty: 'Dr. M.S. Kimmatkar' },
  ];

  const otherCourses = [
    { code: '24AF2PHYBS202', name: 'Engineering Physics', dept: 'Applied Sciences', faculty: 'Mr. Pratap Singh' },
    { code: '24AF2PHYBS203L', name: 'Engineering Physics Lab', dept: 'Applied Sciences', faculty: 'Mr. Pratap Singh' },
    { code: '24AF2EGRES204', name: 'Engineering Graphics', dept: 'Applied Sciences', faculty: 'Mr. S. M. Kamdi' },
    { code: '24AF2EGRES205L', name: 'Engineering Graphics Lab', dept: 'Applied Sciences', faculty: 'Mr. S. M. Kamdi' },
    { code: '24AF1EEEES209', name: 'Energy and Environmental Engineering', dept: 'Applied Sciences', faculty: 'Dr. Ajay Bhoir' },
    { code: '24AF2CMEES208', name: 'Basic Civil and Mechanical Engineering', dept: 'Applied Sciences', faculty: 'Er. Bhagyashri Thele' },
    { code: '24AF1000ES206', name: 'Basic Electrical & Electronics Engineering', dept: 'Applied Sciences', faculty: 'Dr. M.S. Kimmatkar' },
    { code: '24AF1000IK210', name: 'IKS Bucket', dept: 'Applied Sciences', faculty: 'Mrs. Deepali Y. Patil' },
    { code: '24AF1000VS211', name: 'Design Thinking', dept: 'Applied Sciences', faculty: 'Mr. S. M. Kamdi' },
    { code: '24AF1000CC212A', name: 'Integrated Personality Development', dept: 'Applied Sciences', faculty: 'Dr. M.S. Kimmatkar' },
  ];

  for (const c of commonCourses.concat(otherCourses)) {
    const fac = facultyMap[c.faculty];
    await prisma.course.create({ data: { code: c.code, name: c.name, departmentId: departmentMap[c.dept].id, facultyId: fac?.id ?? facultyMap['Dr. D. F. Shastrakar'].id } });
  }

  await prisma.course.create({ data: { code: 'CS201', name: 'Data Structures & Algorithms', departmentId: departmentMap['Computer Science and Engineering'].id, facultyId: facultyMap['Mr. S. M. Kamdi'].id } });
  await prisma.course.create({ data: { code: 'CS202', name: 'Database Management Systems', departmentId: departmentMap['Computer Science and Engineering'].id, facultyId: facultyMap['Mr. S. M. Kamdi'].id } });

  const csvPath = path.join(__dirname, 'studentlist.csv');
  if (!fs.existsSync(csvPath)) throw new Error('studentlist.csv missing in src/prisma');
  const studentsCsv = await parseCSV(csvPath);

  for (const rec of studentsCsv) {
    const deptOriginal = rec['Course Name'] ?? 'Applied Sciences';
    const deptKey = deptKeyFromName(deptOriginal);
    const department = departmentMap[deptKey] ?? departmentMap['Applied Sciences'];
    const candName = rec['Candidate Name']?.trim();
    if (!candName) continue;

    const email = studentEmailFromName(candName);
    const roll = rec['Application ID'] ?? `APP${Math.floor(Math.random() * 10000)}`;
    const group = isGroupA(deptKey) ? 'A' : isGroupB(deptKey) ? 'B' : 'A';
    const section = batchFromRollAndGroup(roll, group as 'A' | 'B');

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) continue;

    await prisma.user.create({
      data: {
        name: candName,
        email,
        passwordHash: hashedStudentPassword,
        role: Role.STUDENT,
        departmentId: department.id,
        student: { create: { rollNo: roll, year: 1, section, mobile: rec['Mobile No'] ?? null, cetPercentile: rec['CET Percentile'] ? parseFloat(rec['CET Percentile']) : null, jeePercentile: rec['JEE Percentile'] ? parseFloat(rec['JEE Percentile']) : null } },
      },
    });
  }

  const groupALectures = [
    { day: 1, time: '10:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 204' },
    { day: 1, time: '11:30', duration: 60, courseCode: '24AF1EMES104', room: 'Room 204' },
    { day: 1, time: '12:30', duration: 60, courseCode: '24AF1000ES106', room: 'Room 204' },
    { day: 1, time: '14:00', duration: 60, courseCode: '24AF1000VS108L', room: 'Room 204' },
    { day: 1, time: '15:00', duration: 60, courseCode: '24AF1CHEBS102', room: 'Room 204' },
    { day: 2, time: '10:30', duration: 120, courseCode: '24AF1CHEBS103L', room: 'Room 204' },
    { day: 2, time: '12:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 204' },
    { day: 2, time: '14:00', duration: 60, courseCode: '24AF1000VS109', room: 'Room 204' },
    { day: 2, time: '15:00', duration: 120, courseCode: '24AF1000CC111', room: 'Room 204' },
    { day: 3, time: '10:30', duration: 60, courseCode: '24AF1CHEBS102', room: 'Room 204' },
    { day: 3, time: '11:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 204' },
    { day: 3, time: '12:30', duration: 60, courseCode: '24AF1EMES104', room: 'Room 204' },
    { day: 4, time: '10:30', duration: 120, courseCode: '24AF1CHEBS103L', room: 'Room 204' },
    { day: 4, time: '12:30', duration: 60, courseCode: '24AF1CHEBS102', room: 'Room 204' },
    { day: 4, time: '14:00', duration: 60, courseCode: '24AF1000VS109', room: 'Room 204' },
    { day: 5, time: '10:30', duration: 120, courseCode: '24AF1000ES107L', room: 'Room 204' },
    { day: 5, time: '12:30', duration: 60, courseCode: '24AF1000ES106', room: 'Room 204' },
  ];

  const groupBLectures = [
    { day: 1, time: '10:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 205' },
    { day: 1, time: '11:30', duration: 60, courseCode: '24AF1000ES206', room: 'Room 205' },
    { day: 1, time: '12:30', duration: 60, courseCode: '24AF1000VS211', room: 'Room 205' },
    { day: 1, time: '14:00', duration: 60, courseCode: '24AF1000VS109', room: 'Room 205' },
    { day: 2, time: '10:30', duration: 60, courseCode: '24AF2PHYBS202', room: 'Room 205' },
    { day: 2, time: '11:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 205' },
    { day: 2, time: '13:30', duration: 60, courseCode: '24AF2CMEES208', room: 'Room 205' },
    { day: 3, time: '10:30', duration: 60, courseCode: '24AF1000BS101', room: 'Room 205' },
    { day: 3, time: '11:30', duration: 120, courseCode: '24AF1000ES206', room: 'Room 205' },
    { day: 4, time: '10:30', duration: 120, courseCode: '24AF2EGRES205L', room: 'Room 205' },
    { day: 4, time: '12:30', duration: 60, courseCode: '24AF2EGRES204', room: 'Room 205' },
    { day: 5, time: '10:30', duration: 120, courseCode: '24AF2PHYBS203L', room: 'Room 205' },
    { day: 5, time: '13:30', duration: 60, courseCode: '24AF1000VS211', room: 'Room 205' },
  ];

  const findCourseByCode = async (code: string) => await prisma.course.findUnique({ where: { code } });

  const defaultFacultyId = Object.values(facultyMap)[0]?.id;
  if (!defaultFacultyId) throw new Error('No faculty created; aborting');

  for (const l of groupALectures) {
    const course = await findCourseByCode(l.courseCode);
    if (!course) continue;
    const facultyId = course.facultyId ?? defaultFacultyId;
    await prisma.lecture.create({ data: { courseId: course.id, facultyId, departmentId: departmentMap['Applied Sciences'].id, dateTime: getLectureDate(l.day, l.time), duration: l.duration, location: l.room } });
  }

  for (const l of groupBLectures) {
    const course = await findCourseByCode(l.courseCode);
    if (!course) continue;
    const facultyId = course.facultyId ?? defaultFacultyId;
    await prisma.lecture.create({ data: { courseId: course.id, facultyId, departmentId: departmentMap['Applied Sciences'].id, dateTime: getLectureDate(l.day, l.time), duration: l.duration, location: l.room } });
  }

  console.log('Seeding finished.');
}

main().catch((e) => { console.error('SEED ERROR', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });