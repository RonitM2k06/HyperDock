// Smooth Scroll for Navbar Links
document.querySelectorAll("nav ul li a").forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        const targetId = this.getAttribute("href").substring(1);
        document.getElementById(targetId).scrollIntoView({ behavior: "smooth" });
    });
});

// Navbar Background Change on Scroll
window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    if (window.scrollY > 50) {
        navbar.style.background = "#000";
    } else {
        navbar.style.background = "rgba(0, 0, 0, 0.8)";
    }
});

