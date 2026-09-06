-- Seed: Aussprache-Übungssätze für alle CEFR-Familien A1–C2.
-- 8 Sätze je Niveau, Fokus auf typische Lautstellen (ch, ü, ö, sch, z …).

INSERT INTO public.pronunciation_prompts (cefr_level, sentence_de, focus, sort_order) VALUES
-- A1
('A1', 'Guten Tag, ich heiße Anna.', 'ie, ch', 1),
('A1', 'Ich komme aus Hannover.', 'kommen, aus', 2),
('A1', 'Das ist mein Freund.', 'eu, nd', 3),
('A1', 'Ich trinke gerne Kaffee.', 'r, ä', 4),
('A1', 'Wo ist der Bahnhof, bitte?', 'ch, hof', 5),
('A1', 'Heute ist das Wetter schön.', 'ö, eu', 6),
('A1', 'Ich habe zwei Brüder.', 'ü, zwei', 7),
('A1', 'Entschuldigung, wie spät ist es?', 'sch, ä', 8),
-- A2
('A2', 'Gestern war ich mit meiner Freundin im Park.', 'war, r', 1),
('A2', 'Kannst du mir bitte helfen?', 'st, pf', 2),
('A2', 'Ich kaufe Brot, Milch und Äpfel.', 'ä, pf', 3),
('A2', 'Wir treffen uns um halb vier vor dem Kino.', 'pf, v', 4),
('A2', 'Meine Wohnung liegt ganz in der Nähe.', 'ö, ch', 5),
('A2', 'Am Wochenende besuche ich meine Eltern.', 'ch, wo', 6),
('A2', 'Der Zug hat zehn Minuten Verspätung.', 'z, ä', 7),
('A2', 'Ich möchte einen Termin beim Arzt machen.', 'ö, ch', 8),
-- B1
('B1', 'Ich bin der Meinung, dass Sport den Alltag erleichtert.', 'ng, ch', 1),
('B1', 'Letztes Jahr habe ich zum ersten Mal allein verreist.', 'z, ei', 2),
('B1', 'Es fällt mir schwer, vor vielen Menschen zu sprechen.', 'sch, ch', 3),
('B1', 'Wenn ich Zeit hätte, würde ich öfter ins Theater gehen.', 'ö, ü', 4),
('B1', 'Die Nachbarin hat uns freundlich begrüßt.', 'ü, ch', 5),
('B1', 'Könntest du das bitte noch einmal wiederholen?', 'ö, ie', 6),
('B1', 'Trotz des Regens sind wir spazieren gegangen.', 'z, sp', 7),
('B1', 'Ich habe mich über die Nachricht sehr gefreut.', 'ü, eu', 8),
-- B2
('B2', 'Es kommt darauf an, wie gründlich man sich vorbereitet.', 'ü, ch', 1),
('B2', 'Die Diskussion hat gezeigt, dass beide Seiten berechtigte Einwände haben.', 'sch, ä', 2),
('B2', 'Ich würde vorschlagen, die Entscheidung um eine Woche zu verschieben.', 'sch, ie', 3),
('B2', 'Eigentlich wollte ich widersprechen, aber mir fehlten die Worte.', 'ch, ei', 4),
('B2', 'Der Vortrag war zwar anspruchsvoll, aber äußerst lehrreich.', 'äu, ch', 5),
('B2', 'Man sollte nicht voreilig urteilen, bevor alle Fakten vorliegen.', 'ei, g', 6),
('B2', 'Inzwischen hat sich die Lage deutlich entspannt.', 'z, sch', 7),
('B2', 'Es wäre wünschenswert, wenn wir uns auf einen Kompromiss einigen könnten.', 'ü, ss', 8),
-- C1
('C1', 'Die These, dass Sprache unser Denken formt, ist keineswegs neu.', 's, z', 1),
('C1', 'Es bedarf einer differenzierten Betrachtung, um vorschnelle Schlüsse zu vermeiden.', 'z, sch', 2),
('C1', 'Ungeachtet aller Einwände bleibt die Kernaussage überzeugend.', 'ä, z', 3),
('C1', 'Die Nuancen der deutschen Satzmelodie entscheiden über Höflichkeit und Distanz.', 'z, ch', 4),
('C1', 'Ein präziser Wortschatz ersetzt mitunter ganze Erklärungen.', 'z, ch', 5),
('C1', 'Sie argumentierte schlüssig, ohne den Gegenüber bloßzustellen.', 'sch, ü', 6),
('C1', 'Die Ironie lag weniger im Inhalt als im Tonfall.', 'ie, f', 7),
('C1', 'Wer Widersprüche aushält, gewinnt an sprachlicher Souveränität.', 'ch, ä', 8),
-- C2
('C2', 'Die feinen Registerwechsel zwischen Amtsdeutsch und Umgangssprache verlangen ein sicheres Gespür.', 'sch, ü', 1),
('C2', 'Selbst flüchtige Alliterationen können einem Satz Gewicht verleihen.', 'fl, tz', 2),
('C2', 'Es ist bezeichnend, wie ein einziges Modalpartikel den ganzen Satz kippt.', 'ch, z', 3),
('C2', 'Zwischen Understatement und Übertreibung liegt die Kunst der Nuance.', 'ü, z', 4),
('C2', 'Die Prosodie verrät oft mehr als die gewählten Lexeme.', 's, ie', 5),
('C2', 'Ein geübtes Ohr unterscheidet Ironie von bloßer Höflichkeit im Bruchteil einer Sekunde.', 'ü, ch', 6),
('C2', 'Sprachliche Eleganz entsteht, wo Präzision und Rhythmus einander tragen.', 'z, ch', 7),
('C2', 'Wer Stil beherrscht, kann auch Schweigen beredt machen.', 'sch, ch', 8);
