/**
 * Seed dummy data for the Atlas Insurance Group API.
 *
 * Usage: npx ts-node src/seed/seed.ts   (or: npm run seed)
 *
 * Idempotent-ish: it clears the seeded tables first, then re-inserts.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env and the
 * 001_initial_schema.sql migration to have been run.
 */
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

const SEED_PASSWORD = 'Password123!';

async function clearTables(): Promise<void> {
  // Delete in FK-dependency order. neq on a never-matching id == delete all.
  const tables = [
    'audit_events',
    'sessions',
    'claims',
    'eligibility',
    'policies',
    'knowledge_articles',
    'brokers',
    'members',
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }
  console.log('🧹 Cleared existing data');
}

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  await clearTables();

  // --- Members ---
  const { data: members, error: membersError } = await supabase
    .from('members')
    .insert([
      {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@email.com',
        phone: '+1-555-0101',
        password_hash: passwordHash,
        mfa_secret: 'JBSWY3DPEHPK3PXP',
      },
      {
        first_name: 'Robert',
        last_name: 'Smith',
        email: 'robert.smith@email.com',
        phone: '+1-555-0102',
        password_hash: passwordHash,
        mfa_secret: 'JBSWY3DPEHPK3PXP',
      },
      {
        first_name: 'Maria',
        last_name: 'Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1-555-0103',
        password_hash: passwordHash,
        mfa_secret: 'JBSWY3DPEHPK3PXP',
      },
    ])
    .select();
  if (membersError) throw membersError;

  const jane = members!.find((m) => m.email === 'jane.doe@email.com')!;
  const robert = members!.find((m) => m.email === 'robert.smith@email.com')!;
  const maria = members!.find((m) => m.email === 'maria.garcia@email.com')!;
  console.log(`👤 Inserted ${members!.length} members`);

  // --- Brokers ---
  const { error: brokersError } = await supabase.from('brokers').insert([
    {
      first_name: 'David',
      last_name: 'Lee',
      email: 'david.lee@brokers.com',
      password_hash: passwordHash,
      license_number: 'BRK-001',
      authorized_member_ids: [jane.id],
    },
    {
      first_name: 'Susan',
      last_name: 'Park',
      email: 'susan.park@brokers.com',
      password_hash: passwordHash,
      license_number: 'BRK-002',
      authorized_member_ids: [robert.id],
    },
  ]);
  if (brokersError) throw brokersError;
  console.log('🧑‍💼 Inserted 2 brokers');

  // --- Policies ---
  const { data: policies, error: policiesError } = await supabase
    .from('policies')
    .insert([
      {
        member_id: jane.id,
        policy_number: 'POL-AUTO-001',
        policy_type: 'auto',
        status: 'active',
        effective_date: '2024-01-01',
        expiration_date: '2025-01-01',
        premium_amount: 1200,
        coverage_limit: 100000,
        deductible: 500,
      },
      {
        member_id: jane.id,
        policy_number: 'POL-HOME-001',
        policy_type: 'home',
        status: 'active',
        effective_date: '2024-03-01',
        expiration_date: '2025-03-01',
        premium_amount: 2400,
        coverage_limit: 300000,
        deductible: 1000,
      },
      {
        member_id: robert.id,
        policy_number: 'POL-HLTH-001',
        policy_type: 'health',
        status: 'active',
        effective_date: '2024-06-01',
        expiration_date: '2025-06-01',
        premium_amount: 4800,
        coverage_limit: 500000,
        deductible: 2500,
      },
      {
        member_id: maria.id,
        policy_number: 'POL-LIFE-001',
        policy_type: 'life',
        status: 'inactive',
        effective_date: '2022-01-01',
        expiration_date: '2023-01-01',
        premium_amount: 600,
        coverage_limit: 1000000,
        deductible: 0,
      },
    ])
    .select();
  if (policiesError) throw policiesError;

  const polAuto = policies!.find((p) => p.policy_number === 'POL-AUTO-001')!;
  const polHome = policies!.find((p) => p.policy_number === 'POL-HOME-001')!;
  const polHealth = policies!.find((p) => p.policy_number === 'POL-HLTH-001')!;
  const polLife = policies!.find((p) => p.policy_number === 'POL-LIFE-001')!;
  console.log(`📄 Inserted ${policies!.length} policies`);

  // --- Eligibility (one per policy) ---
  const { error: eligibilityError } = await supabase.from('eligibility').insert([
    {
      policy_id: polAuto.id,
      eligible: true,
      eligibility_reason: 'Active auto policy within coverage period.',
      source_document: 'Auto Policy Coverage Overview v1.0',
    },
    {
      policy_id: polHome.id,
      eligible: true,
      eligibility_reason: 'Active home policy; premiums current.',
      source_document: 'Home Insurance Master Policy v2.1',
    },
    {
      policy_id: polHealth.id,
      eligible: true,
      eligibility_reason: 'Active health plan; deductible partially met.',
      source_document: 'Health Plan Summary of Benefits v3.0',
    },
    {
      policy_id: polLife.id,
      eligible: false,
      eligibility_reason: 'Policy expired on 2023-01-01 and was not renewed.',
      source_document: 'Life Policy Terms v1.0',
    },
  ]);
  if (eligibilityError) throw eligibilityError;
  console.log('✅ Inserted 4 eligibility records');

  // --- Claims ---
  const { error: claimsError } = await supabase.from('claims').insert([
    {
      member_id: jane.id,
      policy_id: polAuto.id,
      claim_number: 'CLM-2024-001',
      claim_type: 'auto',
      status: 'under_review',
      incident_date: '2024-04-10',
      incident_description: 'Rear-end collision at intersection; bumper damage.',
      adjuster_name: 'Tom Brady',
      adjuster_email: 'tom.brady@atlasins.com',
      next_action: 'Awaiting repair shop estimate.',
      amount_claimed: 4500,
    },
    {
      member_id: jane.id,
      policy_id: polHome.id,
      claim_number: 'CLM-2024-002',
      claim_type: 'home',
      status: 'approved',
      incident_date: '2024-02-15',
      incident_description: 'Water damage from burst pipe in kitchen.',
      adjuster_name: 'Alice Chen',
      adjuster_email: 'alice.chen@atlasins.com',
      next_action: 'Payment scheduled.',
      amount_claimed: 12000,
      amount_approved: 10500,
    },
    {
      member_id: robert.id,
      policy_id: polHealth.id,
      claim_number: 'CLM-2024-003',
      claim_type: 'health',
      status: 'submitted',
      incident_date: '2024-07-01',
      incident_description: 'Emergency room visit for fractured wrist.',
      adjuster_name: null,
      adjuster_email: null,
      next_action: 'Pending adjuster assignment.',
      amount_claimed: 3200,
    },
    {
      member_id: robert.id,
      policy_id: polHealth.id,
      claim_number: 'CLM-2024-004',
      claim_type: 'health',
      status: 'denied',
      incident_date: '2024-05-20',
      incident_description: 'Elective procedure not covered under plan.',
      adjuster_name: 'Mike Ross',
      adjuster_email: 'mike.ross@atlasins.com',
      next_action: 'Member may file an appeal within 30 days.',
      amount_claimed: 8000,
      amount_approved: 0,
    },
    {
      member_id: maria.id,
      policy_id: polLife.id,
      claim_number: 'CLM-2024-005',
      claim_type: 'life',
      status: 'closed',
      incident_date: '2022-12-01',
      incident_description: 'Beneficiary claim on lapsed policy.',
      adjuster_name: 'Sarah Kim',
      adjuster_email: 'sarah.kim@atlasins.com',
      next_action: 'Closed — policy was inactive at time of claim.',
      amount_claimed: 1000000,
      amount_approved: 0,
    },
  ]);
  if (claimsError) throw claimsError;
  console.log('🗂️  Inserted 5 claims');

  // --- Knowledge Articles ---
  const { error: knowledgeError } = await supabase.from('knowledge_articles').insert([
    {
      title: 'Auto Policy Coverage Overview',
      content:
        'Atlas auto policies cover collision, liability, comprehensive, and uninsured ' +
        'motorist protection. Deductibles apply per incident. Roadside assistance is ' +
        'included on active policies.',
      category: 'policy',
      tags: ['auto', 'coverage', 'deductible'],
      source_document: 'Auto Policy Coverage Overview v1.0',
    },
    {
      title: 'Home Insurance Claim Process',
      content:
        'To file a home insurance claim: document the damage with photos, contact Atlas ' +
        'within 72 hours, and submit a completed claim form. An adjuster will be assigned ' +
        'within 3 business days.',
      category: 'procedure',
      tags: ['home', 'claim', 'process'],
      source_document: 'Home Insurance Master Policy v2.1',
    },
    {
      title: 'Health Deductible FAQ',
      content:
        'Your health plan deductible is the amount you pay before coverage begins. ' +
        'Once met, Atlas covers eligible expenses according to your plan tier. Deductibles ' +
        'reset annually on the policy effective date.',
      category: 'faq',
      tags: ['health', 'deductible', 'faq'],
      source_document: 'Health Plan Summary of Benefits v3.0',
    },
    {
      title: 'FNOL Submission Requirements',
      content:
        'A First Notice of Loss (FNOL) must include the policy number, date of incident, ' +
        'a description of the loss, and the claimant contact details. Submitting an FNOL ' +
        'generates a claim reference number used for all follow-up.',
      category: 'procedure',
      tags: ['fnol', 'claim', 'requirements'],
      source_document: 'Claims Handling Procedure v4.2',
    },
    {
      title: 'Broker Authorization Policy',
      content:
        'Brokers may only access member records for which they are explicitly authorized. ' +
        'Authorization is recorded against the broker profile and audited on every access.',
      category: 'compliance',
      tags: ['broker', 'authorization', 'compliance'],
      source_document: 'Broker Conduct & Authorization Policy v1.3',
    },
    {
      title: 'Claims Appeals Process',
      content:
        'If a claim is denied, members may appeal within 30 days. Appeals require a written ' +
        'statement and any supporting documentation. A senior adjuster reviews appeals within ' +
        '10 business days.',
      category: 'procedure',
      tags: ['appeals', 'denied', 'claim'],
      source_document: 'Claims Appeals Procedure v2.0',
    },
  ]);
  if (knowledgeError) throw knowledgeError;
  console.log('📚 Inserted 6 knowledge articles');

  // --- Audit Events (sample) ---
  const { error: auditError } = await supabase.from('audit_events').insert([
    {
      event_type: 'auth',
      session_id: 'seed-session-001',
      member_id: jane.id,
      actor_id: jane.id,
      actor_type: 'member',
      resource_type: 'session',
      resource_id: 'seed-session-001',
      action: 'auth.login_attempt',
      payload: { email: jane.email, role: 'member' },
      ip_address: '203.0.113.10',
    },
    {
      event_type: 'auth',
      session_id: 'seed-session-001',
      member_id: jane.id,
      actor_id: jane.id,
      actor_type: 'member',
      resource_type: 'session',
      resource_id: 'seed-session-001',
      action: 'auth.mfa_verified',
      payload: { method: 'totp' },
      ip_address: '203.0.113.10',
    },
    {
      event_type: 'tool_execution',
      session_id: 'seed-session-001',
      member_id: jane.id,
      actor_id: jane.id,
      actor_type: 'agent',
      resource_type: 'policy',
      resource_id: polAuto.id,
      action: 'policy.eligibility',
      payload: { eligible: true },
      ip_address: '203.0.113.10',
    },
    {
      event_type: 'tool_execution',
      session_id: 'seed-session-002',
      member_id: robert.id,
      actor_id: robert.id,
      actor_type: 'agent',
      resource_type: 'claim',
      resource_id: 'CLM-2024-003',
      action: 'claim.created',
      payload: { claim_number: 'CLM-2024-003' },
      ip_address: '203.0.113.20',
    },
    {
      event_type: 'knowledge_retrieval',
      session_id: 'seed-session-002',
      member_id: robert.id,
      actor_id: robert.id,
      actor_type: 'agent',
      resource_type: 'knowledge',
      resource_id: null,
      action: 'knowledge.search',
      payload: { query: 'health deductible', resultCount: 1 },
      ip_address: '203.0.113.20',
    },
  ]);
  if (auditError) throw auditError;
  console.log('📝 Inserted 5 audit events');

  console.log('\n✨ Seed complete!');
  console.log(`   Seed password for all members/brokers: ${SEED_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  });
