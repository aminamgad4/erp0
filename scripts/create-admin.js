#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Function to prompt for password (hidden input)
function questionPassword(query) {
  return new Promise(resolve => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdmin() {
  let client;
  
  try {
    console.log('🚀 إنشاء مدير نظام جديد\n');
    
    // Get MongoDB URI from environment or prompt
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      mongoUri = await question('أدخل رابط MongoDB (أو اضغط Enter للاستخدام الافتراضي): ');
      if (!mongoUri.trim()) {
        mongoUri = 'mongodb://localhost:27017/arabic_erp';
      }
    }
    
    // Get admin details
    const name = await question('اسم المدير: ');
    if (!name.trim()) {
      console.log('❌ يجب إدخال اسم المدير');
      process.exit(1);
    }
    
    const email = await question('البريد الإلكتروني: ');
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ يجب إدخال بريد إلكتروني صحيح');
      process.exit(1);
    }
    
    const password = await questionPassword('كلمة المرور: ');
    if (!password.trim() || password.length < 6) {
      console.log('❌ يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      process.exit(1);
    }
    
    console.log('\n🔄 جاري الاتصال بقاعدة البيانات...');
    
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('arabic_erp');
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({
      email: email.toLowerCase()
    });
    
    if (existingAdmin) {
      console.log('❌ يوجد مستخدم بهذا البريد الإلكتروني بالفعل');
      process.exit(1);
    }
    
    console.log('🔐 جاري تشفير كلمة المرور...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const adminUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'super-admin',
      modules: {
        crm: true,
        hr: true,
        inventory: true,
        sales: true,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('👤 جاري إنشاء المدير...');
    
    const result = await db.collection('users').insertOne(adminUser);
    
    if (result.insertedId) {
      console.log('\n✅ تم إنشاء مدير النظام بنجاح!');
      console.log('📧 البريد الإلكتروني:', email);
      console.log('🆔 معرف المستخدم:', result.insertedId.toString());
      console.log('\n🎉 يمكنك الآن تسجيل الدخول باستخدام هذه البيانات');
    } else {
      console.log('❌ فشل في إنشاء المدير');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 تم إلغاء العملية');
  rl.close();
  process.exit(0);
});

// Run the script
createAdmin().catch(error => {
  console.error('❌ خطأ غير متوقع:', error);
  process.exit(1);
});