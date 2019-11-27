import React from "react";

export default function Article({ article }) {
  console.log({ article });
  if (!article) {
    return "No content";
  }
  return (
    <>
      <h2>
        {article.title} <span>{article.href}</span>
      </h2>
      {article.subheading && <aside>{article.subheading}</aside>}
      <section>
        {article.content.split("\n").map(p => (
          <p>{p}</p>
        ))}
      </section>
    </>
  );
}
