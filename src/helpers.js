function getMonthName(month) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(month);
  return new Intl.DateTimeFormat("sv", {
    month: "short",
  }).format(date);
}

function getCurrentMonthName() {
  const date = new Date();
  return new Intl.DateTimeFormat("sv", {
    month: "long",
  }).format(date);
}

function getCurrentYear() {
  const date = new Date();
  return new Intl.DateTimeFormat("sv", {
    year: "numeric",
  }).format(date);
}

export { getMonthName, getCurrentMonthName, getCurrentYear };
