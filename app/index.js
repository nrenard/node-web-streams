const API_URL = 'http://localhost:3000';

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal,
  })

  const reader = response.body.pipeThrough(new TextDecoderStream())
  .pipeThrough(parseNDJSON())

  return reader;
}

function appendToHtml (element) {
  console.log('appendToHtml');
  return new WritableStream({
    write({ title, url }) {
      const card = `
        <article>
          <div class="text">
            <h3>${title}</h3>
            <a href="${url}" target="_blank">Go to Anime</a>
          </div>
        </article>
      `
      element.innerHTML += card;
    },
    abort() {
      console.log('aborted...');
    }
  })
}

function parseNDJSON() {
  let bufferJson = '';

  return new TransformStream({
    transform(chunk, controller) {
      bufferJson += chunk
      const items = bufferJson.split('\n')

      items.slice(0, -1)
      .forEach(item => controller.enqueue(JSON.parse(item)))

      bufferJson = items[items.length - 1]
    },

    flush (controller) {
      if (!bufferJson) return;
      controller.enqueue(JSON.parse(bufferJson))
    }
  });
}

let abortController = new AbortController();

const [start, stop, cards] = ['start', 'stop', 'cards'].map(item => document.getElementById(item));

start.addEventListener('click', async () => {
  const readable = await consumeAPI(abortController.signal)
  readable.pipeTo(appendToHtml(cards))
})

stop.addEventListener('click', () => {
  abortController.abort();
  console.log('Aborting...');
  abortController = new AbortController();
})