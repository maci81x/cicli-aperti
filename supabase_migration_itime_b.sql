-- Migration i-Time · PARTE (b): modifiche ai dati esistenti (2026-10-20)
-- Da applicare SOLO dopo aver controllato la mappatura in STATO.md e dopo il backup
-- backup_2026-10-20.json (cicli, categorie, macro_aree, persone, ciclo_persone, assegnazioni).
-- Ogni istruzione ha un WHERE esplicito. Nessun DROP.

-- 1. Le 9 macro aree diventano le 8 di i-Time (stessi id, si rinominano 3 righe e se ne toglie 1)
UPDATE macro_aree SET nome = 'Ricerca e sviluppo'                         WHERE nome = 'R&D';
UPDATE macro_aree SET nome = 'Famiglia / cose personali', icona = 'home'  WHERE nome = 'Personale';
UPDATE macro_aree SET nome = 'Formazione',                icona = 'school' WHERE nome = 'HR';

-- 2. Le cose che avevano i vecchi nomi d'area prendono i nuovi
UPDATE cicli SET macro_area = 'Ricerca e sviluppo'        WHERE macro_area = 'R&D';
UPDATE cicli SET macro_area = 'Famiglia / cose personali' WHERE macro_area = 'Personale';
UPDATE cicli SET macro_area = 'Formazione'                WHERE macro_area = 'HR';
UPDATE cicli SET macro_area = NULL                        WHERE macro_area = 'Da Delegare';

-- 3. «Da Delegare» non è un'area di i-Time (la delega è un tipo di cosa): si toglie la riga,
--    solo se nessuna cosa la usa più (dopo il passo 2 è così)
DELETE FROM macro_aree WHERE nome = 'Da Delegare'
  AND NOT EXISTS (SELECT 1 FROM cicli WHERE macro_area = 'Da Delegare');

-- 4. Ordine e categorie di ogni area (vedi la tabella in STATO.md)
UPDATE macro_aree SET ordine = 1, categorie = ARRAY['management','hr','da-delegare','custom_2','custom_4'] WHERE nome = 'Management';
UPDATE macro_aree SET ordine = 2, categorie = ARRAY['marketing']                                  WHERE nome = 'Marketing';
UPDATE macro_aree SET ordine = 3, categorie = ARRAY['vendite','custom_3']                         WHERE nome = 'Vendite';
UPDATE macro_aree SET ordine = 4, categorie = ARRAY['amministrazione']                            WHERE nome = 'Amministrazione';
UPDATE macro_aree SET ordine = 5, categorie = ARRAY['produzione']                                 WHERE nome = 'Produzione';
UPDATE macro_aree SET ordine = 6, categorie = ARRAY['rnd','idee']                                 WHERE nome = 'Ricerca e sviluppo';
UPDATE macro_aree SET ordine = 7, categorie = ARRAY['salute','relazioni','finanze','hobbies','spiritualita','casa','custom_1','custom_5']
                                                                                                  WHERE nome = 'Famiglia / cose personali';
UPDATE macro_aree SET ordine = 8, categorie = ARRAY['crescita']                                   WHERE nome = 'Formazione';

-- 5. Ogni cosa prende l'area della sua categoria (solo quelle con una categoria mappata e area diversa)
UPDATE cicli c SET macro_area = m.nome
  FROM macro_aree m
  WHERE c.cat = ANY (m.categorie) AND c.macro_area IS DISTINCT FROM m.nome;
