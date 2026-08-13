let travelData = {
    countries: [],
    temples: [],
    beaches: [],
    team: []
};




const $ = (selector) => document.querySelector(selector);

function getImage(item) {
    return item.imageUrl;
}

function destinationCard(destination) {
    return `
    <article class="destination-card" data-destination="${destination.name}">
      <img src="${destination.imageUrl}" alt="${destination.name}">
      <h2>${destination.name}</h2>
      <p>${destination.description}</p>
    </article>
  `;
}

function renderTeam() {
    const team = travelData.team || [];

    $("#teamGrid").innerHTML = team.map(member => `
    <article class="team-member">
      <div class="avatar">●</div>
      <h3>${member.name}</h3>
      <p>${member.description}</p>
      <span>${member.role}</span>
    </article>
  `).join("");
}

function flattenData() {
    return [
        ...travelData.countries.flatMap(country =>
            country.cities.map(city => ({
                ...city,
                country: country.name,
                category: "country"
            }))
        ),
        ...travelData.temples.map(item => ({ ...item, category: "temple" })),
        ...travelData.beaches.map(item => ({ ...item, category: "beach" }))
    ];
}

function findDestinations(term) {
    const q = term.trim().toLowerCase();

    if (!q) return [];

    // Special category searches.
    if (q === "country" || q === "countries") {
        return travelData.countries;
    }

    if (q === "city" || q === "cities") {
        return travelData.countries.flatMap(country =>
            country.cities.map(city => ({
                ...city,
                countryName: country.name
            }))
        );
    }

    if (q === "beach" || q === "beaches") {
        return travelData.beaches || [];
    }

    if (q === "temple" || q === "temples") {
        return travelData.temples || [];
    }

    // Search by country name, city name, destination name,
    // description, or the parent country name.
    const countryResults = travelData.countries.flatMap(country =>
        country.cities
            .filter(city =>
                country.name.toLowerCase().includes(q) ||
                city.name.toLowerCase().includes(q) ||
                city.description.toLowerCase().includes(q)
            )
            .map(city => ({
                ...city,
                countryName: country.name
            }))
    );

    const beachResults = (travelData.beaches || []).filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );

    const templeResults = (travelData.temples || []).filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );

    return [...countryResults, ...beachResults, ...templeResults];
}

function showSearchResults(term) {
    const results = findDestinations(term);

    $("#searchSummary").textContent = results.length
        ? `${results.length} destination${results.length > 1 ? "s" : ""} found for "${term}"`
        : `No destinations found for "${term}". Try beach, temple, country or a destination name.`;

    $("#resultsGrid").innerHTML = results.map(destinationCard).join("");

    if (term.trim().toLowerCase() === "country" ||
        term.trim().toLowerCase() === "countries") {

        document.querySelectorAll(".destination-card").forEach(card => {
            card.addEventListener("click", () => {
                const country = card.dataset.destination;

                $("#searchInput").value = country;

                showSearchResults(country);
            });
        });
    }

    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    $("#searchPage").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "#search");
}

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const page = $("#" + id);

    if (page) {
        page.style.display = id === "home" ? "flex" : "block";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function route() {
    const hash = location.hash.replace("#", "") || "home";

    if (hash === "search") return;

    if (["home", "about", "contact"].includes(hash)) {
        showPage(hash);
    }
}

async function loadTravelData() {
    try {
        const response = await fetch("./travel_recommendation_api.json");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        travelData = await response.json();
        console.log("Travel data loaded from JSON:", travelData);
    } catch (error) {
        console.error("Could not load travel_recommendation_api.json:", error);

        $("#searchSummary").textContent =
            "Could not load travel data. Run the project through a local web server.";

        throw error;
    }
}

$("#searchForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const term = $("#searchInput").value.trim();

    if (!term) return;

    // Wait until the JSON has finished loading.
    await dataReady;

    showSearchResults(term);
});

$("#clearBtn").addEventListener("click", () => {
    $("#searchInput").value = "";
    $("#searchInput").focus();
    showPage("home");
    history.replaceState(null, "", "#home");
});

$("#bookBtn").addEventListener("click", () => {
    $("#bookingDialog").showModal();
});

$("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const status = $("#formStatus");

    if (!form.checkValidity()) {
        status.textContent = "Please complete all fields with valid information.";
        return;
    }

    status.textContent = "Thank you! Your message has been prepared successfully.";
    form.reset();
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        const target = link.getAttribute("href").slice(1);
        setTimeout(() => showPage(target), 0);
    });
});

window.addEventListener("hashchange", route);

const dataReady = loadTravelData();

dataReady.then(() => {
    renderTeam();
    route();
});
