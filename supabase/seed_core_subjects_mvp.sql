-- Already applied on 2026-07-25 via Supabase MCP.
-- Hand-authored stopgap seed for the two most commonly posted
-- subjects (Mathematics, English Language) at JSS and SSS, so
-- quiz screening is usable immediately while the new admin Quiz
-- Bank generator (app/admin/quiz-bank, backed by Gemini) is used
-- to expand coverage to the remaining ~150 subject/level
-- combinations over time.

INSERT INTO quiz_questions (subject, education_level, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_option, question_type, is_active) VALUES
-- Mathematics — JSS
('Mathematics','jss','jss','Simplify: 3(2x + 5) - 4x','2x + 15','10x + 15','6x + 15','2x + 5','a','mcq',true),
('Mathematics','jss','jss','What is the LCM of 4 and 6?','24','12','8','18','b','mcq',true),
('Mathematics','jss','jss','Convert 0.75 to a fraction in its lowest term.','3/4','7/10','3/5','7/5','a','mcq',true),
('Mathematics','jss','jss','Find the value of x: 2x - 3 = 11','5','6','7','8','c','mcq',true),
('Mathematics','jss','jss','What is the sum of the interior angles of a triangle?','90°','180°','270°','360°','b','mcq',true),
('Mathematics','jss','jss','Express 45% as a fraction in its lowest term.','9/20','9/25','4/5','45/50','a','mcq',true),
('Mathematics','jss','jss','What is the HCF of 18 and 24?','2','3','6','9','c','mcq',true),
('Mathematics','jss','jss','A rectangle has length 8cm and width 5cm. Find its perimeter.','13cm','26cm','40cm','20cm','b','mcq',true),
('Mathematics','jss','jss','Simplify: 7² - 3²','40','16','58','10','a','mcq',true),
('Mathematics','jss','jss','What is the next number in the sequence: 2, 4, 8, 16, ___?','20','24','32','18','c','mcq',true),
('Mathematics','jss','jss','If a bag contains 5 red and 3 blue balls, what is the probability of picking a red ball?','3/8','5/8','1/2','5/3','b','mcq',true),
('Mathematics','jss','jss','Find the mean of: 4, 8, 6, 10, 12','8','9','7','10','a','mcq',true),
('Mathematics','jss','jss','What is 15% of 200?','20','25','30','35','c','mcq',true),
('Mathematics','jss','jss','Solve for y: y/4 = 9','13','36','5','40','b','mcq',true),
('Mathematics','jss','jss','A triangle has angles 50° and 70°. What is the third angle?','50°','60°','70°','80°','b','mcq',true),
('Mathematics','jss','jss','Which of these is a prime number?','21','27','29','33','c','mcq',true),

-- Mathematics — SSS
('Mathematics','sss','sss','Solve for x: x² - 5x + 6 = 0','x = 2 or 3','x = 1 or 6','x = -2 or -3','x = 2 or -3','a','mcq',true),
('Mathematics','sss','sss','Find the gradient of the line joining (2,3) and (4,9).','2','3','6','4','b','mcq',true),
('Mathematics','sss','sss','If log₂8 = x, find x.','2','3','4','8','b','mcq',true),
('Mathematics','sss','sss','Differentiate y = 3x² + 2x with respect to x.','6x + 2','3x + 2','6x','x² + 2','a','mcq',true),
('Mathematics','sss','sss','What is the sum of the first 10 terms of the AP: 2, 5, 8, ...?','155','135','145','165','a','mcq',true),
('Mathematics','sss','sss','Simplify: (2x³y²)(3xy⁴)','6x⁴y⁶','5x⁴y⁶','6x³y⁸','6x⁴y⁸','a','mcq',true),
('Mathematics','sss','sss','Find sin30° + cos60°.','1','0.5','1.5','2','a','mcq',true),
('Mathematics','sss','sss','A binary operation * is defined by a*b = a + b - ab. Find 2*3.','-1','1','5','6','a','mcq',true),
('Mathematics','sss','sss','What is the determinant of the matrix [[2,3],[1,4]]?','5','11','8','-5','b','mcq',true),
('Mathematics','sss','sss','Find the equation of a line with gradient 2 passing through (1,3).','y = 2x + 1','y = 2x - 1','y = 2x + 3','y = 2x','a','mcq',true),
('Mathematics','sss','sss','If a die is rolled once, what is the probability of getting a number greater than 4?','1/6','1/3','1/2','2/3','b','mcq',true),
('Mathematics','sss','sss','Find the value of x in: 3^(x+1) = 27','1','2','3','4','b','mcq',true),
('Mathematics','sss','sss','What is the derivative of a constant?','1','The constant itself','0','Undefined','c','mcq',true),
('Mathematics','sss','sss','Find the median of: 3, 7, 9, 12, 15, 18, 21','9','12','15','13','b','mcq',true),
('Mathematics','sss','sss','Simplify √50 in surd form.','5√2','10√5','2√5','25√2','a','mcq',true),
('Mathematics','sss','sss','Two events A and B are mutually exclusive with P(A)=0.3 and P(B)=0.5. Find P(A or B).','0.15','0.8','0.2','1.0','b','mcq',true),

-- English Language — JSS
('English Language','jss','jss','Choose the correctly spelt word.','Recieve','Receive','Receeve','Receve','b','mcq',true),
('English Language','jss','jss','Identify the noun in the sentence: "The teacher praised the diligent student."','Praised','Diligent','Teacher','The','c','mcq',true),
('English Language','jss','jss','Choose the correct plural form of "child".','Childs','Childes','Children','Childern','c','mcq',true),
('English Language','jss','jss','"She sings beautifully." What part of speech is "beautifully"?','Adjective','Adverb','Noun','Verb','b','mcq',true),
('English Language','jss','jss','Choose the correct sentence.','He go to school every day.','He goes to school every day.','He going to school every day.','He gone to school every day.','b','mcq',true),
('English Language','jss','jss','What is the antonym of "generous"?','Kind','Selfish','Wealthy','Honest','b','mcq',true),
('English Language','jss','jss','Choose the word that means the same as "commence".','End','Begin','Pause','Continue','b','mcq',true),
('English Language','jss','jss','Identify the correct punctuation: "Where are you going"','Where are you going.','Where are you going?','Where are you going!','Where are you going,','b','mcq',true),
('English Language','jss','jss','Fill the gap: She is ___ honest woman.','a','an','the','no article needed','b','mcq',true),
('English Language','jss','jss','Choose the correct past tense of "go".','Goed','Went','Gone','Going','b','mcq',true),
('English Language','jss','jss','Which word is a conjunction? "I wanted to go, but it rained."','Wanted','But','Go','Rained','b','mcq',true),
('English Language','jss','jss','Identify the synonym of "happy".','Sad','Joyful','Angry','Tired','b','mcq',true),
('English Language','jss','jss','Choose the correctly punctuated sentence.','Lagos, the largest city in Nigeria is busy.','Lagos, the largest city in Nigeria, is busy.','Lagos the largest city, in Nigeria is busy.','Lagos the largest, city in Nigeria is busy.','b','mcq',true),
('English Language','jss','jss','What is the singular form of "geese"?','Goose','Gooses','Geeses','Goosen','a','mcq',true),
('English Language','jss','jss','Choose the correct comparative form of "good".','Gooder','Better','Best','More good','b','mcq',true),
('English Language','jss','jss','Which sentence uses the correct subject-verb agreement?','The team are playing well.','The team is playing well.','The team be playing well.','The team playing well.','b','mcq',true),

-- English Language — SSS
('English Language','sss','sss','Identify the figure of speech: "The wind whispered through the trees."','Simile','Personification','Metaphor','Hyperbole','b','mcq',true),
('English Language','sss','sss','Choose the correct sentence in reported speech: He said, "I am tired."','He said that he is tired.','He said that he was tired.','He said that he am tired.','He says that he was tired.','b','mcq',true),
('English Language','sss','sss','What is the meaning of the idiom "to break the ice"?','To cause damage','To start a conversation in a social setting','To end a friendship','To cause a delay','b','mcq',true),
('English Language','sss','sss','Identify the correct passive voice of: "The chef cooked the meal."','The meal cooked the chef.','The meal was cooked by the chef.','The meal is cooked by the chef.','The meal has cooked by the chef.','b','mcq',true),
('English Language','sss','sss','Which of these is an example of alliteration?','The sun set slowly','She sells seashells','It was as cold as ice','Time flies','b','mcq',true),
('English Language','sss','sss','Choose the correctly spelt word.','Necessary','Neccessary','Necessery','Neccesary','a','mcq',true),
('English Language','sss','sss','What is the term for a word that sounds the same as another but has a different meaning and spelling?','Synonym','Antonym','Homophone','Homograph','c','mcq',true),
('English Language','sss','sss','Identify the type of clause: "Although it rained, the match continued."','Independent clause','Adjectival clause','Adverbial clause','Noun clause','c','mcq',true),
('English Language','sss','sss','Choose the sentence with correct tense usage.','By the time we arrived, the film had already started.','By the time we arrived, the film has already started.','By the time we arrive, the film had already started.','By the time we arrived, the film starts already.','a','mcq',true),
('English Language','sss','sss','What literary device is used in "Life is a journey"?','Simile','Metaphor','Onomatopoeia','Irony','b','mcq',true),
('English Language','sss','sss','Choose the word closest in meaning to "meticulous".','Careless','Careful','Fast','Lazy','b','mcq',true),
('English Language','sss','sss','Identify the error: "Neither of the students have submitted their assignment."','Neither','Have','Their','No error','b','mcq',true),
('English Language','sss','sss','What is the correct plural of "phenomenon"?','Phenomenons','Phenomena','Phenomenas','Phenomenae','b','mcq',true),
('English Language','sss','sss','Choose the correctly structured conditional sentence.','If I would have known, I would have come.','If I had known, I would have come.','If I knew, I would have come earlier.','If I know, I would come.','b','mcq',true),
('English Language','sss','sss','Identify the antonym of "verbose".','Wordy','Concise','Talkative','Lengthy','b','mcq',true),
('English Language','sss','sss','Which sentence correctly uses a semicolon?','I have a test tomorrow; so I can''t go out tonight.','I have a test tomorrow; I can''t go out tonight.','I have a test tomorrow, I can''t go out tonight.','I have a test tomorrow: and I can''t go out tonight.','b','mcq',true);
