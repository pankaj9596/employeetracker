const cds = require("@sap/cds");

const calculateDaysDifference = async (startDate, endDate) => {
  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const differenceInMilliseconds = end - start;
  const differenceInDays = differenceInMilliseconds / (1000 * 3600 * 24);

  return differenceInDays;
};

const formatDate = (dateObj) => {
  let day = String(dateObj.getDate()).padStart(2, "0");
  let month = String(dateObj.getMonth() + 1).padStart(2, "0");
  let year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format time → HH:mm:ss
const formatTime = (dateObj) => {
  let hours = String(dateObj.getHours()).padStart(2, "0");
  let minutes = String(dateObj.getMinutes()).padStart(2, "0");
  let seconds = String(dateObj.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

exports.calculateDaysDifference = calculateDaysDifference;
exports.formatDate = formatDate;
exports.formatTime = formatTime;
