const formatResponse = ({ data = null, message = "Success" }) => ({
  message,
  data,
});

module.exports = { formatResponse };
