# seo-butler

> Geliştiriciler için uzman bir SEO & GEO ajansı — Claude Code'un içinde.

[English](README.md) · [MIT](LICENSE) · Node 18+

Sen ürünü yaparsın; seo-butler onun bulunmasını sağlar — hem Google'da sıralanmayı, hem ChatGPT, Claude ve Perplexity'de kaynak gösterilmeyi.

Sana SEO sorusu sormaz. Projeni okur, stack'ini tespit eder, bir ajansın yapacağı teknik işi yapar — ama her zaman onayladığın bir plandan sonra, git yedeği ve geri alma ile.

<!-- TODO: demo GIF buraya. Gerçek bir `/seo` koşusu kaydet: keşif → denetim → plan → onay → skor kartı. ~30sn, 800px genişlik. docs/demo.gif olarak koy ve aç:
![seo-butler çalışırken](docs/demo.gif)
-->

## Kurulum

```
/plugin marketplace add mertagralii/seo-butler
/plugin install seo-butler
```

Claude Code'u yeniden başlat. Global kurulur ama yalnızca komutu çalıştırdığın projeye dokunur.

## Kendi notunu kendi vermiyor

Bu plugin bir keresinde bir siteye **98/100** verdi ve 35 maddenin hepsini "yapıldı" işaretledi. Sonra dış bir crawler şunları buldu: üç sayfada 404 veren bir link, beş sayfada ölü bir iletişim linki, ve "yapıldı" işaretli bir maddenin içinde atlanmış bir başlık seviyesi.

Kök neden yapısaldı: kağıt üzerinde var olan ama arkasında mekanik bir kontrol olmayan madde, sessizce "model zaten bakar" seviyesine düşüyordu. Kendi kendini doğrulayan bir sistem, yazmayı unuttuğu kontrolü asla bulamaz.

Bu yüzden `/seo-verify` her deploy'dan sonra siteyi dört bağımsız denetçiye veriyor — Google Search Console, site geneli crawler, GEO denetçisi ve Lighthouse — çünkü her biri başka bir yerde kör. Aynı sitede aynı oturumda ölçüldü: Lighthouse SEO'ya 100/100 verirken crawler 404'ü, GEO denetçisi atlanmış başlığı buldu. Tek bir yeşil skor, denetlediği sayfa hakkında kanıttır; site hakkında değil.

Dış bulgular kanıt sayılıyor, hüküm değil — üç aracın da false positive'i var ve olmayan bir hatayı "düzeltmek" zaten doğru olan siteyi bozar. İki kaynak bağımsız olarak aynı şeyi söylediğinde `corroborated` işaretleniyor.

## Beş komut

| Komut | Cevapladığı soru | Kodunu değiştirir mi? | Sıklık |
|---|---|---|---|
| `/seo` | İşi yaptım mı? | ✅ onaydan sonra | iş oldukça |
| `/seo-live` | Gerçekten yayına çıktı mı? | ❌ | her deploy sonrası |
| `/seo-verify` | Benden başkası da aynı şeyi söylüyor mu? | ✅ onaydan sonra | temiz çıkana kadar |
| `/seo-watch` | Bir şey bozuldu mu? | ❌ | haftalık, gözetimsiz |
| `/seo-report` | İşe yaradı mı? | ❌ | aylık |

**Döngü:** `/seo` → deploy → `/seo-live` → (haftalık `/seo-watch`) → ~4 hafta → `/seo-report` → baştan.

35 maddelik sabit bir checklist üzerinden çalışır. Sabit olması kasıtlı — sonraki koşularda yeni madde uydurmaz. Ya yaptı ya yapmadı.

## GEO birinci sınıf vatandaş

Çoğu SEO aracı 2015'in problemini çözüyor. İnsanlar artık sorularını ChatGPT'ye soruyor.

En yüksek etkili tek ayar, `robots.txt`'inin alıntı botlarını engelleyip engellemediği — GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, GoogleOther, Bytespider, CCBot. Genelde bir `User-agent: *` bloğu bunları kimse istemeden süpürüyor.

Ötesi: kilit içeriğin sunucu tarafında render edilmesi (SPA boşlukları), cevap-önce yapı, semantik HTML, FAQ blokları, schema katmanlama.

`llms.txt` bilerek düşük ağırlıklı — 2026 itibarıyla hiçbir büyük yapay zekâ motoru onu resmen tüketmiyor, ve bu plugin kaynağını gösteremediği bir sayıyı kendi lehine bile olsa tekrarlamıyor.

## Dürüstlük kapıları

- **Kural hatırlanmaz, okunur.** Her checklist maddesi resmi dokümanının adresini taşır. Ulaşılamayan kaynak sebebiyle bildirilir, "doğrulandı" sayılmaz.
- **Hiçbir şey tahmin edilmez.** Ölçülemeyen şey, sebebiyle birlikte "ölçülemedi" yazılır.
- **Uygulandı ≠ yayında.** Deploy edilmemiş iş sıfır etki eder ve her koşu bunu söyler.
- **Skor hesaplanır.** Değişmemiş bir sitede iki koşu byte-identik çıktı verir. n/a maddeler paydadan düşer.
- **Yazmadan önce onay.** Meta/başlık/alt doğrudan düzenlenir; gövde metni her zaman plana girer.
- **Uydurma içeriğe schema eklenmez.** Doğrulanamayan yorum bloklarına `Review` şeması konmaz — bu, SEO sorunu değil yanıltıcı reklam riski olarak bildirilir.
- **Şifren asla istenmez.**

## Gereksinimler

| Ne | Gerekli mi | Not |
|---|---|---|
| Node 18+ | ✅ | `scripts/` için. Başka bağımlılık yok. |
| chrome-devtools MCP | Önerilir | Lighthouse'u yerelde çalıştırır, kota ve anahtar yok. Pakette. |
| Yerel Chrome/Edge/Chromium | Önerilir | Yukarıdakinin yedeği. Kurulacak bir şey yok. |
| Google hesabı | Search Console/GA4 için | Girişi bir kez sen yaparsın. |
| geodaddy MCP | Önerilir | GEO denetçisi. Ücretsiz, hesap istemez. Pakette. |
| OpenSEO MCP | Opsiyonel | Site geneli crawl + Search Console. Okuma ücretsiz. |

Hafızası `./.seo-butler/state.json` içinde. Bunu gitignore'a eklemeni önerir (iş profili içerir), ama karar senin.

## Script'leri doğrudan çalıştırmak

Plugin'e gerek yok:

```bash
node scripts/validate-artifacts.mjs --url https://siten.com --root . --json
node scripts/score.mjs --state ./.seo-butler/state.json --fail-under 90
node scripts/triage-external.mjs --openseo issues.json --geodaddy gd.json --lighthouse lhr.json
```

`--url` herhangi bir origin alır, yani `http://localhost:5173` de olur — bütün render-zamanı kontrolleri deploy'dan önce koşar. Bu önemli: şablon motorunun JSON-LD tipini HTML-encode etmesi ya da sitemap'e BOM koyması dosyalarda görünmez, sadece sunucunun gönderdiği byte'larda görünür.

`--fail-under` ve `--fail-on-act` sıfırdan farklı kodla çıkar, yani ikisi de CI kapısı olur.

`npm test` test paketini koşar. Bağımlılık yok, ağ gerekmiyor.

## Bilinen eksikler

Güncel sürüm **v2.4.0**. Dört komut da gerçek bir projede (ASP.NET Core MVC, canlı site) uçtan uca çalıştırıldı ve dürüstlük kapılarını geçti. Hâlâ test edilmemiş olanlar:

- Sıfırdan bir projede ilk koşu hiç denenmedi.
- v2.3.0 kaynak kaydının 35 URL'i çözülüyor ve testlerle korunuyor, ama canlı bir koşuda bir uzmanın kaynağı okuyup ona göre iş yapması henüz izlenmedi.
- Yerel Lighthouse basamağı Windows'ta tek başına doğrulandı, ama tam bir `/seo-live` koşusu bu yoldan geçmedi.

Bu bölüm burada, çünkü plugin senin siteni tuttuğu kuralın aynısına kendini de tutuyor.

---

`growth-butler`'dan (v1.x) geçiş: komutlar `/growth-seo*` → `/seo*` oldu, mevcut `.growth-butler/state.json` ilk koşuda okunup taşınıyor.
