const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jzcabyfyxsugzrxenybx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y2FieWZ5eHN1Z3pyeGVueWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQwNzMxNCwiZXhwIjoyMTA0OTgzMzE0fQ.2w9wd8JHKFZDVaXr7L0LJYXYJZG7ICz8GhfaUzv9zwY';

const workspaceDir = 'c:\\Users\\gowth\\Desktop\\project - yanc';
const teamDir = path.join(workspaceDir, 'Sections', 'Team');
const pfpDir = path.join(teamDir, 'team_pfp');

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
};

async function main() {
  console.log('🚀 Starting YANC Team Migration to Supabase...\n');

  // 1. Ensure team_photos bucket exists and is public
  console.log('1. Checking / creating "team_photos" storage bucket...');
  const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 'team_photos',
      name: 'team_photos',
      public: true,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    })
  });

  if (bucketRes.ok) {
    console.log('   ✅ Bucket "team_photos" created successfully.');
  } else {
    const errText = await bucketRes.text();
    if (errText.includes('already exists') || errText.includes('Duplicate')) {
      console.log('   ✅ Bucket "team_photos" already exists.');
    } else {
      console.log('   ℹ️ Bucket response:', errText);
    }
  }

  // 2. Upload all images from Sections/Team/team_pfp
  console.log('\n2. Uploading team profile photos to Supabase Storage...');
  const photoUrlMap = {}; // local filename -> public Supabase URL

  if (fs.existsSync(pfpDir)) {
    const photoFiles = fs.readdirSync(pfpDir);
    for (const file of photoFiles) {
      const fullPath = path.join(pfpDir, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      let mime = 'image/jpeg';
      if (ext === '.png') mime = 'image/png';
      if (ext === '.webp') mime = 'image/webp';
      if (ext === '.gif') mime = 'image/gif';

      const fileBuffer = fs.readFileSync(fullPath);
      // Clean safe name for URL
      const safeName = encodeURIComponent(file);

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/team_photos/${safeName}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': mime,
          'x-upsert': 'true'
        },
        body: fileBuffer
      });

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/team_photos/${safeName}`;
        photoUrlMap[file] = publicUrl;
        photoUrlMap[`team_pfp/${file}`] = publicUrl;
        photoUrlMap[`team_pfp/${encodeURIComponent(file)}`] = publicUrl;
        console.log(`   Uploaded: ${file}`);
      } else {
        console.error(`   ❌ Failed to upload ${file}:`, await uploadRes.text());
      }
    }
  }
  console.log(`   ✅ Total photos uploaded & mapped: ${Object.keys(photoUrlMap).length / 3}`);

  // 3. Extract team members from all 6 HTML files
  console.log('\n3. Extracting members from all 6 team HTML pages...');
  const files = [
    { file: 'advisory-board.html', category: 'advisory-board' },
    { file: 'executive-management.html', category: 'executive-management' },
    { file: 'cohort-founders.html', category: 'cohort-founders' },
    { file: 'cohort-ambassadors.html', category: 'cohort-ambassadors' },
    { file: 'cohort-members.html', category: 'cohort-members' },
    { file: 'cross-borders.html', category: 'cross-borders' }
  ];

  let allMembers = [];

  for (const { file, category } of files) {
    const filePath = path.join(teamDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const cardChunks = content.split(/<div\s+class="team-card"/i);
    cardChunks.shift();

    cardChunks.forEach((chunk, index) => {
      const dataNameMatch = chunk.match(/data-name="([^"]*)"/);
      const dataRoleMatch = chunk.match(/data-role="([^"]*)"/);
      const dataBioMatch = chunk.match(/data-bio="([^"]*)"/);
      const dataInitialsMatch = chunk.match(/data-initials="([^"]*)"/);
      const dataPhotoMatch = chunk.match(/data-photo="([^"]*)"/);
      const dataLinkedinMatch = chunk.match(/data-linkedin="([^"]*)"/);

      const htmlNameMatch = chunk.match(/class="member-name">([^<]+)</);
      const htmlRoleMatch = chunk.match(/class="member-role">([^<]+)</);
      const htmlInitialsMatch = chunk.match(/class="avatar-fallback">([^<]+)</);
      const htmlPhotoMatch = chunk.match(/<img[^>]*src="([^"]+)"/);
      const htmlLinkedinMatch = chunk.match(/href="(https:\/\/[^"]*linkedin[^"]*)"/);

      const name = (dataNameMatch ? dataNameMatch[1] : (htmlNameMatch ? htmlNameMatch[1] : '')).trim();
      const role = (dataRoleMatch ? dataRoleMatch[1] : (htmlRoleMatch ? htmlRoleMatch[1] : '')).trim();
      const bio = (dataBioMatch ? dataBioMatch[1] : '').trim();
      const initials = (dataInitialsMatch ? dataInitialsMatch[1] : (htmlInitialsMatch ? htmlInitialsMatch[1] : '')).trim();
      let rawPhoto = (dataPhotoMatch ? dataPhotoMatch[1] : (htmlPhotoMatch ? htmlPhotoMatch[1] : '')).trim();
      const linkedin = (dataLinkedinMatch ? dataLinkedinMatch[1] : (htmlLinkedinMatch ? htmlLinkedinMatch[1] : 'https://linkedin.com')).trim();

      // Resolve public photo URL
      let photoUrl = '';
      if (rawPhoto) {
        const decoded = decodeURIComponent(rawPhoto.replace(/^team_pfp\//, ''));
        photoUrl = photoUrlMap[decoded] || photoUrlMap[rawPhoto] || '';
      }

      if (name) {
        allMembers.push({
          name,
          role,
          bio,
          initials: initials || name.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase(),
          photo_url: photoUrl,
          linkedin_url: linkedin,
          category,
          sort_order: index + 1
        });
      }
    });
    console.log(`   ${file} (${category}): parsed members`);
  }

  console.log(`   Total parsed members: ${allMembers.length}`);

  // 4. Insert all members into Supabase database
  console.log('\n4. Inserting members into "team_members" table...');
  // First clear any existing records to avoid duplicates
  await fetch(`${SUPABASE_URL}/rest/v1/team_members?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers
  });

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(allMembers)
  });

  if (insertRes.ok) {
    const inserted = await insertRes.json();
    console.log(`   ✅ Successfully inserted ${inserted.length} members into Supabase!`);
  } else {
    console.error('   ❌ Insertion error:', await insertRes.text());
  }

  // 5. Verify database records
  console.log('\n5. Verifying database records by category:');
  for (const cat of ['advisory-board', 'executive-management', 'cohort-founders', 'cohort-ambassadors', 'cohort-members', 'cross-borders']) {
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/team_members?category=eq.${cat}&select=id,name,role,photo_url`, {
      headers
    });
    if (checkRes.ok) {
      const items = await checkRes.json();
      console.log(`   • ${cat.padEnd(22)} : ${items.length} members stored`);
    }
  }

  console.log('\n🎉 Migration complete!');
}

main().catch(console.error);
