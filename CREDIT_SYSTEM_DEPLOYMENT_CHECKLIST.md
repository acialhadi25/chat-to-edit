# ✅ Credit System Deployment Checklist

**Target Date:** TBD  
**Estimated Time:** 2-4 hours  
**Risk Level:** Medium (database migration required)

---

## 🎯 Pre-Deployment (1 Week Before)

### Planning
- [ ] Review all documentation
- [ ] Schedule deployment window (low traffic time)
- [ ] Notify team members
- [ ] Prepare rollback plan
- [ ] Set up monitoring alerts

### Testing on Staging
- [ ] Deploy migration to staging database
- [ ] Verify migration completed successfully
- [ ] Test credit display in UI
- [ ] Test credit tracking
- [ ] Test limit checking
- [ ] Test error handling
- [ ] Test upgrade flow
- [ ] Verify old data converted correctly
- [ ] Performance test with load

### Communication Preparation
- [ ] Draft user announcement email
- [ ] Update pricing page content
- [ ] Update help documentation
- [ ] Prepare FAQ responses
- [ ] Train support team
- [ ] Prepare social media posts

---

## 🚀 Deployment Day

### Phase 1: Backup (30 minutes)

#### Database Backup
```bash
# Full database backup
pg_dump -h <host> -U <user> -d <database> -F c -f backup_before_credit_migration_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list backup_before_credit_migration_*.dump | head -20
```

- [ ] Database backup completed
- [ ] Backup file verified
- [ ] Backup stored in secure location
- [ ] Backup size confirmed (should be reasonable)

#### Code Backup
```bash
# Tag current production version
git tag -a v1.0.0-pre-credit-system -m "Before credit system migration"
git push origin v1.0.0-pre-credit-system
```

- [ ] Git tag created
- [ ] Tag pushed to remote
- [ ] Current production version documented

---

### Phase 2: Database Migration (30-60 minutes)

#### Pre-Migration Checks
- [ ] Verify database connection
- [ ] Check current table sizes
- [ ] Verify no active long-running queries
- [ ] Note current user count
- [ ] Note current usage_tracking row count

#### Run Migration
```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manual SQL
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260220000001_migrate_to_credit_system.sql
```

- [ ] Migration script executed
- [ ] No errors in output
- [ ] All tables updated
- [ ] All functions created
- [ ] Indexes created

#### Post-Migration Verification
```sql
-- Check subscription_tiers updated
SELECT name, limits FROM subscription_tiers;

-- Check usage_tracking converted
SELECT COUNT(*), resource_type FROM usage_tracking GROUP BY resource_type;

-- Test functions
SELECT * FROM get_user_usage('<test-user-id>');
SELECT check_usage_limit('<test-user-id>', 'credits');
```

- [ ] Subscription tiers have credit limits
- [ ] Usage tracking only has 'credits' resource_type
- [ ] Functions work correctly
- [ ] No orphaned data
- [ ] Row counts match expectations

---

### Phase 3: Code Deployment (30 minutes)

#### Frontend Build
```bash
# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Verify build
ls -lh dist/
```

- [ ] Dependencies installed
- [ ] Build completed successfully
- [ ] No build errors
- [ ] Bundle size reasonable
- [ ] Assets generated

#### Deploy to Hosting
```bash
# Example: Vercel
vercel --prod

# Example: Netlify
netlify deploy --prod

# Example: Manual
# Upload dist/ folder to hosting
```

- [ ] Code deployed
- [ ] Deployment successful
- [ ] New version live
- [ ] Old version backed up

#### Edge Functions Deployment
```bash
# Deploy all edge functions
supabase functions deploy chat
supabase functions deploy midtrans-create-transaction
supabase functions deploy midtrans-webhook
supabase functions deploy midtrans-subscription
supabase functions deploy subscription-renewal
```

- [ ] All edge functions deployed
- [ ] No deployment errors
- [ ] Functions accessible
- [ ] Environment variables set

---

### Phase 4: Verification (30 minutes)

#### Smoke Tests
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays credits
- [ ] Credit usage display shows correct data
- [ ] Can perform AI action
- [ ] Credit tracking works
- [ ] Limit checking works
- [ ] Error messages display correctly
- [ ] Upgrade flow works
- [ ] Payment flow works

#### User Journey Tests
```
Test User 1: Free Tier
- [ ] See 100 credits limit
- [ ] Perform action (credits decrease)
- [ ] Hit limit (see error message)
- [ ] See upgrade prompt

Test User 2: Pro Tier
- [ ] See 2,000 credits limit
- [ ] Perform multiple actions
- [ ] Credits tracked correctly
- [ ] Usage percentage correct

Test User 3: New User
- [ ] Sign up
- [ ] Get free tier automatically
- [ ] See 100 credits
- [ ] Can use features
```

#### Database Verification
```sql
-- Check active users have correct limits
SELECT 
  u.email,
  st.name as tier,
  st.limits->>'credits_per_month' as credits_limit,
  ut.count as credits_used
FROM auth.users u
LEFT JOIN user_subscriptions us ON us.user_id = u.id
LEFT JOIN subscription_tiers st ON st.id = us.subscription_tier_id
LEFT JOIN usage_tracking ut ON ut.user_id = u.id AND ut.resource_type = 'credits'
LIMIT 10;
```

- [ ] Users have correct tier
- [ ] Credits limits correct
- [ ] Usage tracked correctly
- [ ] No data inconsistencies

---

### Phase 5: Monitoring (First 24 Hours)

#### Metrics to Watch
- [ ] Error rate (should be < 1%)
- [ ] API response times (should be normal)
- [ ] Database query performance
- [ ] Credit tracking success rate
- [ ] User complaints/support tickets
- [ ] Conversion rate (free → pro)

#### Monitoring Tools
```bash
# Check Supabase logs
# Dashboard → Logs → Filter by error

# Check Sentry (if configured)
# Dashboard → Issues

# Check application logs
# Your hosting platform logs
```

- [ ] Monitoring dashboard set up
- [ ] Alerts configured
- [ ] Team notified of monitoring plan
- [ ] On-call person assigned

#### Key Metrics Baseline
```
Before Migration:
- Active users: _____
- Daily API calls: _____
- Error rate: _____
- Avg response time: _____

After Migration (24h):
- Active users: _____
- Daily API calls: _____
- Error rate: _____
- Avg response time: _____
```

---

## 📢 Post-Deployment Communication

### User Announcement
- [ ] Send email to all users
- [ ] Post on social media
- [ ] Update in-app notifications
- [ ] Update blog/changelog

### Email Template
```
Subject: 🎉 Simpler Pricing - Introducing Credits!

Hi [Name],

We've made pricing simpler! Instead of tracking multiple limits, 
you now have one easy number: Credits.

What changed:
✅ One metric instead of three
✅ More flexible - use credits your way
✅ Easier to understand

Your account:
- Current plan: [Free/Pro/Enterprise]
- Credits: [X] per month
- All your data is safe

Learn more: [link to help docs]

Questions? Reply to this email.

Thanks,
ChaTtoEdit Team
```

- [ ] Email sent
- [ ] Social media posted
- [ ] In-app notification shown
- [ ] Help docs updated

---

## 🔄 Rollback Plan (If Needed)

### When to Rollback
- Critical errors affecting > 10% of users
- Data corruption detected
- Payment processing broken
- Major performance degradation

### Rollback Steps

#### 1. Database Rollback (15 minutes)
```sql
-- Restore from backup
pg_restore -h <host> -U <user> -d <database> -c backup_before_credit_migration_*.dump

-- Or manual revert
UPDATE subscription_tiers SET limits = old_limits_backup;
ALTER TABLE usage_tracking DROP CONSTRAINT usage_tracking_resource_type_check;
ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_resource_type_check 
  CHECK (resource_type IN ('excel_operation', 'file_upload', 'ai_message'));
```

- [ ] Backup restored
- [ ] Tables verified
- [ ] Functions reverted
- [ ] Data integrity checked

#### 2. Code Rollback (10 minutes)
```bash
# Revert to previous version
git revert <commit-hash>
npm run build
vercel --prod  # or your deployment command
```

- [ ] Code reverted
- [ ] Build successful
- [ ] Deployed
- [ ] Verified working

#### 3. Communication
- [ ] Notify users of temporary issue
- [ ] Explain what happened
- [ ] Provide timeline for fix
- [ ] Apologize for inconvenience

---

## 📊 Success Criteria

### Technical Success
- [ ] Migration completed without errors
- [ ] All tests passing
- [ ] Error rate < 1%
- [ ] Performance within normal range
- [ ] No data loss

### Business Success
- [ ] User complaints < 5%
- [ ] Support tickets manageable
- [ ] Conversion rate maintained or improved
- [ ] No payment processing issues

### User Success
- [ ] Users understand new system
- [ ] Positive feedback received
- [ ] Feature usage maintained
- [ ] Upgrade rate stable or improved

---

## 📝 Post-Deployment Tasks (Week 1)

### Day 1
- [ ] Monitor metrics closely
- [ ] Respond to user questions
- [ ] Fix any critical bugs
- [ ] Update documentation based on feedback

### Day 2-3
- [ ] Analyze user behavior
- [ ] Review support tickets
- [ ] Identify common issues
- [ ] Plan improvements

### Day 4-7
- [ ] Collect user feedback
- [ ] Measure conversion rates
- [ ] Analyze credit usage patterns
- [ ] Plan optimizations

### Week 1 Report
```
Deployment Summary:
- Date: _____
- Duration: _____
- Issues: _____
- Resolution: _____

Metrics:
- Users affected: _____
- Error rate: _____
- Support tickets: _____
- User feedback: _____

Next Steps:
1. _____
2. _____
3. _____
```

---

## 🎓 Team Training

### Support Team
- [ ] Explain credit system
- [ ] Show how to check user credits
- [ ] Teach troubleshooting steps
- [ ] Provide FAQ responses
- [ ] Practice upgrade conversations

### Development Team
- [ ] Review new code
- [ ] Understand credit tracking
- [ ] Know rollback procedure
- [ ] Understand monitoring
- [ ] Practice incident response

---

## 📞 Emergency Contacts

```
On-Call Engineer: _____
Phone: _____
Email: _____

Backup Engineer: _____
Phone: _____
Email: _____

Database Admin: _____
Phone: _____
Email: _____

Product Manager: _____
Phone: _____
Email: _____
```

---

## ✅ Final Checklist

### Before Going Live
- [ ] All tests passed
- [ ] Backup completed
- [ ] Team notified
- [ ] Monitoring ready
- [ ] Rollback plan ready
- [ ] Communication prepared

### Go/No-Go Decision
- [ ] Technical lead approval
- [ ] Product manager approval
- [ ] Database admin approval
- [ ] Support team ready
- [ ] Monitoring team ready

### After Going Live
- [ ] Deployment verified
- [ ] Users notified
- [ ] Monitoring active
- [ ] Team on standby
- [ ] Documentation updated

---

## 🎉 Deployment Complete!

Once all items are checked:

1. Announce success to team
2. Thank everyone involved
3. Monitor for 24-48 hours
4. Collect feedback
5. Plan improvements
6. Celebrate! 🎊

---

**Prepared by:** Kiro AI Assistant  
**Date:** February 20, 2026  
**Version:** 1.0.0  
**Status:** Ready for Deployment
