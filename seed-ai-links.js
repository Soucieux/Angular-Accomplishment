const cloudbase = require('./node_modules/@cloudbase/js-sdk/dist/index.cjs.js');

const app = cloudbase.init({ env: 'vision-canvas-2gs531jy76d7aaa9', region: 'ap-shanghai' });
const auth = app.auth({ persistence: 'none' });
const db = app.database();

const AI_TOOLS = [
    { title: 'Claude',     url: 'https://claude.ai'             },
    { title: 'ChatGPT',    url: 'https://chatgpt.com'           },
    { title: 'Perplexity', url: 'https://www.perplexity.ai'     },
    { title: 'Gemini',     url: 'https://gemini.google.com/app' },
    { title: 'Grok',       url: 'https://grok.com'              },
    { title: 'DeepSeek',   url: 'https://chat.deepseek.com'     },
    { title: 'Mistral',    url: 'https://chat.mistral.ai'       },
    { title: 'KIMI',       url: 'https://www.kimi.com/en'       },
    { title: 'You.com',    url: 'https://you.com'               },
    { title: 'Meta AI',    url: 'https://www.meta.ai'           }
];

async function seed() {
    await auth.anonymousAuthProvider().signIn();

    const catResult = await db.collection('useful_links').add({
        _openid: '2023990860389482498',
        type: 'category',
        name: 'AI Tools',
        color: '#7c3aed',
        order: 0
    });
    const categoryId = catResult.id;
    console.log('Created category AI Tools:', categoryId);

    const createdAt = new Date().toISOString();
    await Promise.all(AI_TOOLS.map(tool =>
        db.collection('useful_links').add({
            _openid: '2023990860389482498',
            type: 'link',
            url: tool.url,
            title: tool.title,
            category: categoryId,
            visitCount: 0,
            createdAt,
            isPinned: true
        }).then(r => console.log('Added:', tool.title, r.id))
    ));

    console.log(`Done — ${AI_TOOLS.length} AI tools seeded under AI Tools category.`);
}

seed().catch(console.error);
