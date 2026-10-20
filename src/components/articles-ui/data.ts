import "server-only";
import approved from "./fixtures/approved36.json";
export const articles = approved.items;
export const cards = articles.map(({id,card_title,card_summary,topic_label}, index) => ({id,card_title,card_summary,topic_label,index}));
