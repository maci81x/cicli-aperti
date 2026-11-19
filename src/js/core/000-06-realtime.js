// ══════════════════════════════════════════════════════════════
// REALTIME
// ══════════════════════════════════════════════════════════════
db.channel('cicli-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cicli' },     () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'persone' },   () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'categorie' }, () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_override' }, () => loadAll())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'rituali_completati' }, () => loadAll())
  .subscribe(status => {
    if (status === 'SUBSCRIBED') console.log('[Realtime] connesso');
  });

