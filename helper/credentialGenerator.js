async function generateUsername(fullname, id) {
  return `nla${fullname.toLowerCase().split(" ").join("")}${id}`;
}

async function generatePassword(dob) {
  var options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    // timeZone: "UTC", // Optionally specify the time zone
    // timeZoneName: "short", // Optionally include the time zone name
  };
  let indianDateFormat = dob.toLocaleDateString("en-IN", options);
  console.log(indianDateFormat);
  return `${indianDateFormat.split("/").join("")}`;
}

module.exports = { generateUsername, generatePassword };
