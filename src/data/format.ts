const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}
