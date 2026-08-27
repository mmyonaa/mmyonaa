// 블로그 RSS에서 최근 글을 읽어 README의 마커 사이를 갈아끼운다.
// 외부 의존성 없이 Node 내장만 쓴다.
import { readFile, writeFile } from "node:fs/promises";

const FEED = "https://mmyonaa.github.io/blog/rss.xml";
const COUNT = 5;
const START = "<!-- posts:start -->";
const END = "<!-- posts:end -->";
const README = new URL("../README.md", import.meta.url);

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};
const decode = (s) =>
  s.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (m) => ENTITIES[m]);

const res = await fetch(FEED);
if (!res.ok) throw new Error(`RSS 응답 ${res.status}`);
const xml = await res.text();

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  .slice(0, COUNT)
  .map(([, item]) => {
    const tag = (name) =>
      decode(
        item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1].trim() ??
          "",
      );
    const date = new Date(tag("pubDate")).toISOString().slice(0, 10);
    return `- [${tag("title")}](${tag("link")}) — <sub>${date}</sub>`;
  });

// 피드가 비었을 때 README의 목록을 지워버리지 않는다.
if (items.length === 0) throw new Error("RSS에 항목이 없다");

const readme = await readFile(README, "utf8");
const head = readme.split(START)[0];
const tail = readme.split(END)[1];
if (tail === undefined) throw new Error("README에서 마커를 찾지 못했다");

await writeFile(README, `${head}${START}\n${items.join("\n")}\n${END}${tail}`);
console.log(`최근 글 ${items.length}건 반영`);
