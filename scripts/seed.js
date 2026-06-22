require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../src/models/Company');
const Student = require('../src/models/Student');
const Job = require('../src/models/Job');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Company.deleteMany({});
  await Student.deleteMany({});
  await Job.deleteMany({});

  const company = await Company.create({
    name: 'TechCorp India',
    email: 'hr@techcorp.in',
    location: 'Bangalore'
  });

  const student = await Student.create({
    name: 'Vishnu K',
    email: 'vishnu@test.com',
    skills: ['JavaScript', 'NodeJS', 'MongoDB'],
    skillScores: { JavaScript: 80, NodeJS: 75, MongoDB: 70 },
    cgpa: 8.5,
    graduationYear: 2025
  });

  const job = await Job.create({
    title: 'Backend Developer',
    description: 'Build REST APIs using Node.js and MongoDB',
    company: company._id,
    requiredSkills: ['JavaScript', 'NodeJS', 'MongoDB'],
    competencyThreshold: 70,
    location: 'Bangalore',
    salary: { min: 600000, max: 1200000 }
  });

  console.log('\n✅ Seeded successfully!');
  console.log('COMPANY_ID=' + company._id);
  console.log('STUDENT_ID=' + student._id);
  console.log('JOB_ID=' + job._id);
  await mongoose.disconnect();
};

seed().catch(console.error);
