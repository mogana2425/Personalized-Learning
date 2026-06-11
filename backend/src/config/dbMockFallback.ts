import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';

const syncDocToSupabase = async (collection: string, docId: string, data: any) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('plis_documents')
      .upsert(
        { collection, doc_id: docId, data },
        { onConflict: 'collection,doc_id' }
      );
    if (error) {
      console.error(`[Mock DB] Error syncing ${collection} (${docId}) to Supabase:`, error.message);
    }
  } catch (err: any) {
    console.error(`[Mock DB] Unexpected error syncing to Supabase:`, err.message);
  }
};

const deleteDocFromSupabase = async (collection: string, docId: string) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('plis_documents')
      .delete()
      .match({ collection, doc_id: docId });
    if (error) {
      console.error(`[Mock DB] Error deleting ${collection} (${docId}) from Supabase:`, error.message);
    }
  } catch (err: any) {
    console.error(`[Mock DB] Unexpected error deleting from Supabase:`, err.message);
  }
};

export const loadFromSupabase = async () => {
  if (!supabase) return;
  try {
    console.log('[Mock DB] Fetching documents from Supabase...');
    const { data, error } = await supabase
      .from('plis_documents')
      .select('collection, doc_id, data');
    
    if (error) {
      console.error('[Mock DB] Error loading from Supabase:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`[Mock DB] Successfully loaded ${data.length} documents from Supabase.`);
      
      // Group documents by collection
      data.forEach((row) => {
        const store = getStore(row.collection);
        // Avoid duplicates in memory if already exists
        const existingIdx = store.findIndex(item => item._id?.toString() === row.doc_id);
        if (existingIdx !== -1) {
          store[existingIdx] = row.data;
        } else {
          store.push(row.data);
        }
      });
    } else {
      console.log('[Mock DB] No documents found on Supabase.');
    }
  } catch (err: any) {
    console.error('[Mock DB] Unexpected error loading from Supabase:', err.message);
  }
};

// Dynamic In-Memory Mock Database
const memoryStore: Record<string, any[]> = {};

// Helper to access collections in memory
const getStore = (colName: string): any[] => {
  let key = colName || '';
  const lowerCol = key.toLowerCase();
  
  if (lowerCol === 'users' || lowerCol === 'user') key = 'User';
  else if (lowerCol === 'profiles' || lowerCol === 'profile') key = 'Profile';
  else if (lowerCol === 'progresses' || lowerCol === 'progress') key = 'Progress';
  else if (lowerCol === 'learningpaths' || lowerCol === 'learningpath') key = 'LearningPath';
  else if (lowerCol === 'quizzes' || lowerCol === 'quiz') key = 'Quiz';
  else if (lowerCol === 'answersheets' || lowerCol === 'answersheet') key = 'AnswerSheet';
  else if (lowerCol === 'notifications' || lowerCol === 'notification') key = 'Notification';
  else if (lowerCol === 'tutorchats' || lowerCol === 'tutorchat') key = 'TutorChat';

  if (!memoryStore[key]) {
    memoryStore[key] = [];
  }
  return memoryStore[key];
};

// Seeding standard assets for initial out-of-the-box demo functionality
export const seedMockDatabase = async () => {
  if (supabase) {
    await loadFromSupabase();
  }

  console.log('[Mock DB] Seeding default assets into memory store...');

  // 1. Mock users for role logins
  const users = getStore('User');
  if (users.length === 0) {
    const studentId = new mongoose.Types.ObjectId();
    const teacherId = new mongoose.Types.ObjectId();
    const parentId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();
    
    // Hash password with bcrypt so standard comparison inside authController passes successfully
    const hashedPassword = bcrypt.hashSync('password123', 10);

    users.push({
      _id: studentId,
      name: 'Demo Student',
      email: 'student@plis.com',
      password: hashedPassword,
      role: 'student',
      parentEmail: 'parent@plis.com',
    });
    users.push({
      _id: teacherId,
      name: 'Demo Teacher',
      email: 'teacher@plis.com',
      password: hashedPassword,
      role: 'teacher',
    });
    users.push({
      _id: parentId,
      name: 'Demo Parent',
      email: 'parent@plis.com',
      password: hashedPassword,
      role: 'parent',
      childEmails: ['student@plis.com'],
    });
    users.push({
      _id: adminId,
      name: 'Demo Admin',
      email: 'admin@plis.com',
      password: hashedPassword,
      role: 'admin',
    });

    // 2. Mock profiles for student
    const profiles = getStore('Profile');
    profiles.push({
      _id: new mongoose.Types.ObjectId(),
      studentId,
      class: 'Grade 10',
      school: 'Helsinki Academy',
      preferredLearningStyle: 'visual',
      learningInterests: ['Algebra', 'Astronomy', 'Robotics'],
      learningGoals: ['Understand Calculus', 'Build Web App'],
      skillScores: { Algebra: 75, Geometry: 55, Calculus: 30 },
    });

    // 3. Mock progress
    const progress = getStore('Progress');
    progress.push({
      _id: new mongoose.Types.ObjectId(),
      studentId,
      overallProgress: 45,
      streak: 5,
      lastActiveDate: new Date(),
      weeklyHours: [2, 3, 1, 4, 2, 0, 0],
      completedTopicsCount: 8,
      quizzesTaken: [
        { quizId: new mongoose.Types.ObjectId(), title: 'Algebra quiz', score: 4, totalQuestions: 5, accuracy: 80, date: new Date() },
      ],
      timeSpentMinutes: 320,
    });

    // 4. Default Mock Learning Path
    const paths = getStore('LearningPath');
    paths.push({
      _id: new mongoose.Types.ObjectId(),
      studentId,
      subject: 'Mathematics',
      active: true,
      currentWeek: 1,
      weeks: [
        {
          weekNumber: 1,
          title: 'Foundations of Algebra',
          status: 'active',
          subtopics: [
            {
              name: 'Quadratic Equations',
              description: 'Factoring, quadratic formula, and graphing parabolas.',
              status: 'active',
              resources: [
                { title: 'Algebra Equations Guide', type: 'note', textContent: 'A quadratic equation is of the form ax^2 + bx + c = 0. Use the quadratic formula x = (-b ± √(b^2 - 4ac)) / 2a to solve.' },
                { title: 'Factoring Quadratic Videos', type: 'video', description: 'Video covering quadratic solutions by grouping.' },
                { title: 'Equation Practice Cards', type: 'flashcard', textContent: 'Q: What is the quadratic formula?\nA: x = (-b ± √(b^2 - 4ac)) / 2a\n\nQ: What is the discriminant?\nA: b^2 - 4ac' }
              ],
            },
            {
              name: 'Linear Graphs',
              description: 'Plotting lines, calculating slopes, and intercepts.',
              status: 'locked',
              resources: [],
            }
          ],
        }
      ],
    });
  }
};

// Helper to verify matching filters
const matchesFilter = (item: any, filter: any): boolean => {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const key of Object.keys(filter)) {
    let filterVal = filter[key];
    if (filterVal && typeof filterVal === 'object' && filterVal.toString) {
      filterVal = filterVal.toString();
    }
    let itemVal = item[key];
    if (itemVal && typeof itemVal === 'object' && itemVal.toString) {
      itemVal = itemVal.toString();
    }
    
    // Exact or partial string match
    if (itemVal !== filterVal) {
      return false;
    }
  }
  return true;
};

// List of Mongoose native collection methods to override
const methodsToOverride = [
  'findOne', 'find', 'insertOne', 'insertMany', 'updateOne', 'updateMany',
  'deleteOne', 'deleteMany', 'findOneAndUpdate', 'countDocuments'
];

const originalMethods: Record<string, any> = {};

function handleResult(promise: Promise<any>, callback: any) {
  if (callback) {
    promise.then(
      (res) => callback(null, res),
      (err) => callback(err)
    );
    return;
  }
  return promise;
}

methodsToOverride.forEach((methodName) => {
  const original = (mongoose.Collection.prototype as any)[methodName];
  originalMethods[methodName] = original;

  (mongoose.Collection.prototype as any)[methodName] = function (this: any, ...args: any[]) {
    const colName = this.modelName || this.name;
    const isConnected = mongoose.connection.readyState === 1 && this._getCollection();
    
    // If the database is online and active, route the call to the original driver method
    if (isConnected) {
      return original.apply(this, args);
    }

    const store = getStore(colName);
    const filter = args[0];
    const update = args[1];
    const lastArg = args[args.length - 1];
    const callback = typeof lastArg === 'function' ? lastArg : null;

    console.log(`[Mock DB Fallback] Intercepted native collection method: ${colName}.${methodName}`);

    let promise: Promise<any>;

    if (methodName === 'findOne') {
      const found = store.find((item) => matchesFilter(item, filter));
      promise = Promise.resolve(found ? JSON.parse(JSON.stringify(found)) : null);
    } else if (methodName === 'find') {
      const found = store.filter((item) => matchesFilter(item, filter));
      const docs = JSON.parse(JSON.stringify(found));
      promise = Promise.resolve({
        toArray: () => Promise.resolve(docs),
        forEach: (cb: any) => docs.forEach(cb),
      });
    } else if (methodName === 'countDocuments') {
      const count = store.filter((item) => matchesFilter(item, filter)).length;
      promise = Promise.resolve(count);
    } else if (methodName === 'insertOne') {
      const doc = filter;
      if (!doc._id) {
        doc._id = new mongoose.Types.ObjectId();
      }
      store.push(JSON.parse(JSON.stringify(doc)));
      
      // Sync to Supabase
      syncDocToSupabase(colName, doc._id.toString(), doc);

      promise = Promise.resolve({
        acknowledged: true,
        insertedId: doc._id,
      });
    } else if (methodName === 'insertMany') {
      const docs = filter;
      docs.forEach((doc: any) => {
        if (!doc._id) {
          doc._id = new mongoose.Types.ObjectId();
        }
        store.push(JSON.parse(JSON.stringify(doc)));
        
        // Sync to Supabase
        syncDocToSupabase(colName, doc._id.toString(), doc);
      });
      promise = Promise.resolve({
        acknowledged: true,
        insertedCount: docs.length,
        insertedIds: docs.map((d: any) => d._id),
      });
    } else if (methodName === 'updateOne' || methodName === 'findOneAndUpdate') {
      const query = filter;
      let index = store.findIndex((item) => matchesFilter(item, query));
      let doc: any;
      if (index === -1) {
        const options = args[2];
        if (options && options.upsert) {
          doc = { _id: new mongoose.Types.ObjectId(), ...query };
          store.push(doc);
        } else {
          promise = Promise.resolve(methodName === 'findOneAndUpdate' ? { value: null } : { matchedCount: 0, modifiedCount: 0 });
          return handleResult(promise, callback);
        }
      } else {
        doc = store[index];
      }

      if (update) {
        const setPayload = update.$set || update;
        for (const k of Object.keys(setPayload)) {
          if (!k.startsWith('$')) {
            doc[k] = setPayload[k];
          }
        }
        if (update.$push) {
          for (const k of Object.keys(update.$push)) {
            if (!doc[k]) doc[k] = [];
            const pushVal = update.$push[k];
            // Support $each operator: { $push: { field: { $each: [...] } } }
            if (pushVal && typeof pushVal === 'object' && pushVal.$each) {
              pushVal.$each.forEach((item: any) => doc[k].push(item));
            } else {
              doc[k].push(pushVal);
            }
          }
        }
      }

      const docCloned = JSON.parse(JSON.stringify(doc));
      
      // Sync to Supabase
      syncDocToSupabase(colName, docCloned._id.toString(), docCloned);

      if (methodName === 'findOneAndUpdate') {
        promise = Promise.resolve({ value: docCloned, ok: 1 });
      } else {
        promise = Promise.resolve({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
      }
    } else if (methodName === 'updateMany') {
      const query = filter;
      const matchingDocs = store.filter((item) => matchesFilter(item, query));
      if (update) {
        const setPayload = update.$set || update;
        matchingDocs.forEach((doc) => {
          for (const k of Object.keys(setPayload)) {
            if (!k.startsWith('$')) {
              doc[k] = setPayload[k];
            }
          }
          // Sync each updated doc to Supabase
          syncDocToSupabase(colName, doc._id.toString(), doc);
        });
      }
      promise = Promise.resolve({ acknowledged: true, matchedCount: matchingDocs.length, modifiedCount: matchingDocs.length });
    } else if (methodName === 'deleteOne' || methodName === 'deleteMany') {
      const query = filter;
      const initialLength = store.length;
      
      // Find matches first to delete from Supabase
      const matchesToDelete = store.filter((item) => matchesFilter(item, query));
      matchesToDelete.forEach((item) => {
        if (item._id) {
          deleteDocFromSupabase(colName, item._id.toString());
        }
      });

      const storeFiltered = store.filter((item) => !matchesFilter(item, query));
      store.length = 0;
      storeFiltered.forEach((item) => store.push(item));
      promise = Promise.resolve({ acknowledged: true, deletedCount: initialLength - storeFiltered.length });
    } else {
      promise = Promise.resolve(null);
    }

    return handleResult(promise, callback);
  };
});
