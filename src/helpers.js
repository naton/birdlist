function getMonthName(month, length) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(month);
  return new Intl.DateTimeFormat("sv", {
    month: length ? "long" : "short",
  }).format(date);
}

function getCurrentYear() {
  const date = new Date();
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
  }).format(date);
}

export { getMonthName, getCurrentYear };
