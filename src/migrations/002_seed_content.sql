INSERT INTO site_settings (
  singleton, organization_name, english_name, intro_eyebrow, intro_headline,
  intro_body, footer_description, copyright
) VALUES (
  TRUE,
  '울산작은고래지킴이협회',
  'Ulsan Tiny Whale Association',
  '안히 시러ㅓ요',
  '울산작은고래를 위한 서비스를 개발하고, 울산작은고래를 보호합니다.',
  E'안녕하세요.\n선린 울산 홍보대사 울산작은고래지킴이협회입니다.',
  '울산작은고래를 위한 서비스를 만들고 보호합니다.',
  '© 2026 USWA'
) ON CONFLICT (singleton) DO NOTHING;

INSERT INTO recent_cards (id, title, content, image_url, position) VALUES
  ('10000000-0000-4000-8000-000000000001', '블루벨리', '블루베리 키워서 부자되기', 'https://ssf.sunrin.io/cover/para.png', 1),
  ('10000000-0000-4000-8000-000000000002', '최서윤의 블루베리 스무디 가게', '블루베리 스무디를 열심히 팔아보자', 'https://avatars.githubusercontent.com/u/152141311?s=200&v=4', 2),
  ('10000000-0000-4000-8000-000000000003', '최서윤 타자연습', '사투리에 적응 하기', 'https://s3.sunrin-para.dev/paradb/members/930ec7d3-1693-4a6e-ba3e-6f78827a990d.webp', 3),
  ('10000000-0000-4000-8000-000000000004', '울산가자', '어디서든 울산으로 가장 빠르게', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0NALrzD4LyxoBsGtUlsOMNK9ILw3kc-Y8v6ATjQq_n5Z0yUNv9Oag2OxD&s=10', 4),
  ('10000000-0000-4000-8000-000000000005', '협회원 공개 모집', '울산 및 울산작은고래에 관심있는 사람이라면 누구나 지원 가능합니다.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0NALrzD4LyxoBsGtUlsOMNK9ILw3kc-Y8v6ATjQq_n5Z0yUNv9Oag2OxD&s=10', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, title, developers, content, detail_content, hashtags, image_url, link, position) VALUES
  ('20000000-0000-4000-8000-000000000001', '블루벨리', ARRAY['최서윤', '최지원'], E'블루베리를 키워서 부자가 되어 보세요.\n블루베리스무디를 만들어 팔아 자수성가를 이뤄 보세요.', E'작은 블루베리 농장에서 시작해 나만의 농장을 키워 보세요. 직접 기른 블루베리를 수확하고 판매하며 조금씩 성장하는 재미를 느낄 수 있습니다.\n\n수확한 블루베리로 스무디를 만들어 더 많은 수익에 도전해 보세요. 재배부터 판매까지, 나만의 속도로 블루베리 부자가 되어 보세요.', ARRAY['게임', '블루베리', '농장키우기'], 'https://i.ytimg.com/vi/5xm55wjNNpM/maxresdefault.jpg', 'https://example.com/services/blueberry', 1),
  ('20000000-0000-4000-8000-000000000002', '최서윤의 블루베리스무디 가게', ARRAY['최서윤', '이서후'], E'완벽한 블루베리스무디를 만들어 보세요.\n블루베리스무디를 만들어 최고의 매출을 만드세요.', E'블루베리스무디 가게의 사장이 되어 손님을 맞이해 보세요. 재료를 준비하고 주문에 맞는 스무디를 만들며 나만의 가게를 운영할 수 있습니다.\n\n한 잔씩 정성껏 만들어 판매하고 최고의 매출에 도전해 보세요.', ARRAY['게임', '스무디', '가게운영'], 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbDo_FcHMBCObgCdOxE6LPjciuuehN33nh_pw8zIpeu37dOpDsclaBKi5z&s=10', 'https://example.com/services/smoothie', 2),
  ('20000000-0000-4000-8000-000000000003', '최서윤의 타자연습', ARRAY['최서윤', '고윤'], E'최서윤의 dm 말투를 따라잡아 보세요.\n그녀의 오타까지 흡수하세요.', E'최서윤의 개성 있는 DM 문장으로 타자 연습을 해 보세요. 익숙한 표현부터 예상하지 못한 오타까지, 제시된 문장을 그대로 입력하며 말투를 따라가 보세요.\n\n짧은 문장부터 차근차근 연습해 보세요.', ARRAY['타자연습', 'DM', '말투따라잡기'], 'https://i.ytimg.com/vi/ZPcvAi7aDog/maxresdefault.jpg', 'https://example.com/services/typing', 3),
  ('20000000-0000-4000-8000-000000000004', '서윤랭', ARRAY['최서윤', '이서후', '최지원'], E'이제는 코딩도 울산에서,\n울산작은고래로 코딩에 입문해보세요.', E'울산작은고래의 표현을 담은 서윤랭으로 코딩을 시작해 보세요. 친숙한 말로 짧은 코드를 작성하며 프로그래밍의 흐름을 익힐 수 있습니다.\n\n간단한 예제를 하나씩 따라 작성하고 직접 바꿔 보세요.', ARRAY['프로그래밍', '코딩입문', '울산작은고래'], 'https://i.ytimg.com/vi/krdo3gwNdAU/maxresdefault.jpg', 'https://example.com/services/typing', 4),
  ('20000000-0000-4000-8000-000000000005', '최서윤 번역기', ARRAY['최서윤', '윤준서'], E'울산 사투리, 알아듣기 힘들었죠?\n이젠 번역해서 들어보세요.', E'낯선 울산 사투리 때문에 대화의 뜻을 놓쳤다면 최서윤 번역기를 사용해 보세요. 궁금한 표현을 입력하고 익숙한 말로 뜻을 확인할 수 있습니다.\n\n일상에서 만나는 사투리 표현을 하나씩 알아가 보세요.', ARRAY['번역기', '울산사투리', '커뮤니케이션'], 'https://media.nudge-community.com/6426131', 'https://example.com/services/typing', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO members (id, name, role, image_url, position) VALUES
  ('30000000-0000-4000-8000-000000000001', '최서윤', '울산작은고래', 'https://i.namu.wiki/i/y7ZZJQ2qBx1SWinGfzYpHOjmUaarmzNWoFCYA-RElXbmhR2zCOyVxEVCY7RwG9YQ9hNHnjb7ESpRD98DJId5QA.webp', 1),
  ('30000000-0000-4000-8000-000000000002', '최지원', '울산작은고래지킴이협회장', 'https://thumb.mt.co.kr/cdn-cgi/image/f=avif/21/2024/12/2024121110110632754_1.jpg', 2),
  ('30000000-0000-4000-8000-000000000003', '고윤', '울산작은고래지킴이부협회장', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzBDQSNPJBzyUE-Lhcoa-ezUVvhKy1KLh3isd2dVb_DKEPIicXu06r10k&s=10', 3),
  ('30000000-0000-4000-8000-000000000004', '이서후', '울산작은고래지킴이홍보부장', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjcVI61x_acAtryzxAKGdjNtUkyHUWt-SR23LP2qOkHiJkBKxjTQUAOEpI&s=10', 4),
  ('30000000-0000-4000-8000-000000000005', '문정후', '울산작은고래지킴이관리부장', 'https://image.ajunews.com/content/image/2024/09/14/20240914163355127311.jpg', 5),
  ('30000000-0000-4000-8000-000000000006', '양서진', '울산작은고래지킴이회계부장', 'https://thumb.mtstarnews.com/06/2024/08/2024080618495453018_1.jpg', 6),
  ('30000000-0000-4000-8000-000000000007', '윤준서', '울산작은고래지킴이개발부장', 'https://yt3.googleusercontent.com/YZp4q9DPBncZpmR9DuEYWLoR_h_eebcu5NFc_2wi_YrvvT8Z6vgmx1AxnI60Wj0ZdQuBTNTk7Q=s900-c-k-c0x00ffffff-no-rj', 7),
  ('30000000-0000-4000-8000-000000000008', '주서연', '울산작은고래지킴이통합부장', 'https://img.etoday.co.kr/pto_db/2025/11/600/20251120121713_2256744_869_1087.jpg', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO faqs (id, question, answer, position) VALUES
  ('40000000-0000-4000-8000-000000000001', '울산작은고래지킴이협회는 어떤 일을 하나요?', '울산작은고래를 위한 서비스를 개발하고, 울산작은고래를 보호하는 활동을 합니다.', 1),
  ('40000000-0000-4000-8000-000000000002', '울산 고래는 총 몇마리 인가요?', '울산 앞바다를 포함한 동해에 서식 하는 고래는 약 2만 마리 이상으로 추정됩니다.', 2),
  ('40000000-0000-4000-8000-000000000003', '울산 작은 고래를 주로 어디에서 출몰 하나요?', '서울시 용산구 청파동 원효로 선린인터넷고등학교 정보보호과 1-2반 에서 자주 목격됩니다.', 3),
  ('40000000-0000-4000-8000-000000000004', '울산작은고래의 크기는 어느정도 인가요?', '가장 최근에는 159.9cm로 관측되었습니다. 성장 가능성은 매우 낮다고 추정됩니다.', 4),
  ('40000000-0000-4000-8000-000000000005', '울산작은고래 흡연 논란이 사실인가요?', '사실이 아닙니다. 울산작은고래는 바다에서 활동하기 때문에 불을 이용하는 흡연 특성상 사실 확인이 어렵습니다.', 5)
ON CONFLICT (id) DO NOTHING;
