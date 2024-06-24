document.addEventListener("DOMContentLoaded", function() {
  const datetime = (new Date()).toLocaleString()

  document.querySelectorAll("[data-datetime]").forEach((element) => {
    element.textContent = datetime
  })
})
