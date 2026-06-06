import { supabase } from '@/lib/supabase';
import { PrimaryEmotion, StressLevel, EnergyLevel, StressTriggerType } from '@/types';

export async function seedDemoData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Clear existing data for this user first to ensure a clean state
    await supabase.from('mood_entries').delete().eq('user_id', userId);
    await supabase.from('journal_entries').delete().eq('user_id', userId);
    await supabase.from('ai_insights').delete().eq('user_id', userId);

    const entriesToInsert = [];
    const triggersToInsert = [];
    const insightsToInsert = [];
    const journalsToInsert = [];

    const now = new Date();

    // Define 14 days of student behavior:
    // Days 14 to 8: Balanced prep, low-medium stress
    // Days 7 to 3: Mock test pressure, rising study hours, dropping sleep, high stress, anxious emotions
    // Days 2 to today: Burnout symptoms, very high study hours, very low sleep, overwhelmed emotions
    const historyTemplate = [
      { dayOffset: 14, mood: 8, sleep: 8.0, study: 6.0, stress: 'Low' as StressLevel, energy: 'High' as EnergyLevel, emotion: 'Happy' as PrimaryEmotion, reflection: 'Studying went really well today. Completed my physics chapters early.', triggers: [] as StressTriggerType[] },
      { dayOffset: 13, mood: 7, sleep: 7.5, study: 6.5, stress: 'Low' as StressLevel, energy: 'Medium' as EnergyLevel, emotion: 'Calm' as PrimaryEmotion, reflection: 'Good session in the library. Feeling motivated.', triggers: [] as StressTriggerType[] },
      { dayOffset: 12, mood: 8, sleep: 8.0, study: 5.5, stress: 'Low' as StressLevel, energy: 'High' as EnergyLevel, emotion: 'Motivated' as PrimaryEmotion, reflection: 'Had a solid study block. Revised chemistry formulae.', triggers: [] as StressTriggerType[] },
      { dayOffset: 11, mood: 7, sleep: 7.0, study: 7.0, stress: 'Medium' as StressLevel, energy: 'Medium' as EnergyLevel, emotion: 'Neutral' as PrimaryEmotion, reflection: 'A bit tired today but managed to cover my daily goals.', triggers: ['Time management'] as StressTriggerType[] },
      { dayOffset: 10, mood: 6, sleep: 6.5, study: 8.0, stress: 'Medium' as StressLevel, energy: 'Medium' as EnergyLevel, emotion: 'Neutral' as PrimaryEmotion, reflection: 'Chemistry mock test coming up, feeling slightly nervous.', triggers: ['Mock test performance'] as StressTriggerType[] },
      { dayOffset: 9, mood: 8, sleep: 8.0, study: 6.0, stress: 'Low' as StressLevel, energy: 'High' as EnergyLevel, emotion: 'Calm' as PrimaryEmotion, reflection: 'Mock test went fine. Happy with the results.', triggers: [] as StressTriggerType[] },
      { dayOffset: 8, mood: 7, sleep: 7.5, study: 7.5, stress: 'Medium' as StressLevel, energy: 'Medium' as EnergyLevel, emotion: 'Motivated' as PrimaryEmotion, reflection: 'Pushing hard. Starting math section.', triggers: ['Lack of preparation'] as StressTriggerType[] },
      // The stress buildup starts here
      { dayOffset: 7, mood: 5, sleep: 6.0, study: 9.5, stress: 'Medium' as StressLevel, energy: 'Medium' as EnergyLevel, emotion: 'Anxious' as PrimaryEmotion, reflection: 'Mock test scores dropped. I am worried my rank is sliding.', triggers: ['Mock test performance', 'Social comparison'] as StressTriggerType[] },
      { dayOffset: 6, mood: 5, sleep: 5.5, study: 10.0, stress: 'Medium' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Frustrated' as PrimaryEmotion, reflection: 'Stuck on coordinate geometry. Time is running out.', triggers: ['Time management', 'Lack of preparation'] as StressTriggerType[] },
      { dayOffset: 5, mood: 4, sleep: 5.0, study: 11.0, stress: 'High' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Anxious' as PrimaryEmotion, reflection: 'Parents asked about mock test progress. Felt the pressure today.', triggers: ['Parental expectations', 'Mock test performance'] as StressTriggerType[] },
      { dayOffset: 4, mood: 4, sleep: 5.5, study: 11.5, stress: 'High' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Sad' as PrimaryEmotion, reflection: 'Tried to study all day but was very distracted and tired.', triggers: ['Exam pressure', 'Time management'] as StressTriggerType[] },
      // Severe fatigue / burnout zone
      { dayOffset: 3, mood: 3, sleep: 4.5, study: 13.0, stress: 'High' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Overwhelmed' as PrimaryEmotion, reflection: 'Studying late, barely slept. Head is hurting. Can I clear JEE?', triggers: ['Exam pressure', 'Results anxiety', 'Health issues'] as StressTriggerType[] },
      { dayOffset: 2, mood: 2, sleep: 4.0, study: 14.0, stress: 'High' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Burnt Out' as PrimaryEmotion, reflection: 'Exhausted. Cannot retain anything. Just staring at books.', triggers: ['Exam pressure', 'Lack of preparation', 'Results anxiety'] as StressTriggerType[] },
      { dayOffset: 1, mood: 3, sleep: 4.5, study: 12.0, stress: 'High' as StressLevel, energy: 'Low' as EnergyLevel, emotion: 'Overwhelmed' as PrimaryEmotion, reflection: 'Scared of failure. Peer students seem to be doing much better.', triggers: ['Mock test performance', 'Social comparison', 'Results anxiety'] as StressTriggerType[] },
    ];

    // 2. Loop templates and compile inserts
    for (const t of historyTemplate) {
      const entryDate = new Date();
      entryDate.setDate(now.getDate() - t.dayOffset);

      const { data: moodEntry, error: insertError } = await supabase
        .from('mood_entries')
        .insert({
          user_id: userId,
          created_at: entryDate.toISOString(),
          mood_score: t.mood,
          stress_level: t.stress,
          energy_level: t.energy,
          sleep_hours: t.sleep,
          study_hours: t.study,
          primary_emotion: t.emotion,
          reflection: t.reflection,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add triggers
      if (t.triggers.length > 0) {
        for (const trigName of t.triggers) {
          triggersToInsert.push({
            user_id: userId,
            mood_entry_id: moodEntry.id,
            created_at: entryDate.toISOString(),
            trigger_name: trigName,
          });
        }
      }

      // Populate some mock journals for history
      if (t.dayOffset % 3 === 0) {
        journalsToInsert.push({
          user_id: userId,
          created_at: entryDate.toISOString(),
          content: `Focusing on study logs: ${t.reflection} Need to practice and solve math problems.`,
          sentiment_score: t.mood >= 7 ? 0.6 : t.mood >= 5 ? 0.1 : -0.7,
          ai_summary: `Student reflecting on: ${t.reflection.slice(0, 40)}...`,
        });
      }
    }

    // 3. Bulk insert triggers and journals
    if (triggersToInsert.length > 0) {
      const { error: triggerErr } = await supabase.from('stress_triggers').insert(triggersToInsert);
      if (triggerErr) throw triggerErr;
    }

    if (journalsToInsert.length > 0) {
      const { error: journalErr } = await supabase.from('journal_entries').insert(journalsToInsert);
      if (journalErr) throw journalErr;
    }

    // 4. Generate a matching AI insight block for today's state
    insightsToInsert.push({
      user_id: userId,
      created_at: now.toISOString(),
      burnout_score: 82,
      burnout_level: 'High Risk',
      recommendation: {
        study: [
          'Take a full rest day immediately to recover mental stamina.',
          'Cut study blocks down to 45 minutes with mandatory 15-minute breaks.',
          'Postpone next full-syllabus mock test by 2 days to relieve pressure.',
        ],
        mental: [
          'Disconnect from peer study groups for 24 hours to stop social comparison.',
          'Practice a 10-minute guided grounding meditation before sleep.',
          'Write down three non-academic achievements to rebuild self-worth.',
        ],
        physical: [
          'Go for a 20-minute light jog or walk outside to clear cortisol.',
          'Keep your water intake high (at least 3 liters).',
          'Stretch your shoulders and neck every 2 hours of sitting.',
        ],
        sleep: [
          'Maintain a strict sleep window of at least 7.5 hours.',
          'No screens or books in bed. Keep study area separate from sleep area.',
        ],
      },
      insight:
        'Your profile shows a critical accumulation of stress combined with severely reduced sleep (average 4.3 hrs) and excessive study workloads (average 13 hrs) over the last 3 days. Your primary emotion is Burnt Out. Action is required: reduce study hours immediately to prevent cognitive exhaustion.',
    });

    const { error: insightErr } = await supabase.from('ai_insights').insert(insightsToInsert);
    if (insightErr) throw insightErr;

    return { success: true };
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    return { success: false, error: err.message || 'Unknown database error' };
  }
}
