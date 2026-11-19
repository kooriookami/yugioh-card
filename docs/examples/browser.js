import { YugiohCard } from 'yugioh-card';

const app = document.querySelector('#app');
const view = document.createElement('div');
const save = document.createElement('button');
const status = document.createElement('p');

save.type = 'button';
save.textContent = 'Download PNG';
save.disabled = true;
status.setAttribute('role', 'status');
app.replaceChildren(view, save, status);

const card = new YugiohCard({
  view,
  resourcePath: `${import.meta.env.BASE_URL}card-assets`,
  data: {
    language: 'en',
    name: 'Demo Dragon',
    attribute: 'light',
    level: 8,
    monsterTypeLine: 'Dragon / Normal',
    cardText: 'A dragon drawn on Canvas.',
    atk: 3000,
    def: 2500,
    renderScale: 0.4,
  },
});

try {
  await card.ready;
  save.disabled = false;
} catch (error) {
  status.textContent = error.message;
}

save.addEventListener('click', async () => {
  save.disabled = true;
  status.textContent = '';
  try {
    await card.ready;
    await card.leafer.export('card.png', { screenshot: true, pixelRatio: window.devicePixelRatio });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    save.disabled = false;
  }
});
