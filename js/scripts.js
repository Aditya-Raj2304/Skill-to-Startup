/* =========================================================
API CONFIG
========================================================= */

const API_BASE = "http://localhost:5000";

/* =========================================================
AUTH STATE — backed by a real JWT from the backend
========================================================= */

const TOKEN_KEY = "sts_token";
const USER_KEY = "sts_user";

const getToken = () => localStorage.getItem(TOKEN_KEY);

const isSignedIn = () => !!getToken();

const getCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

const apiFetch = (path, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  }).then(async (res) => {
    let data = null;

    try {
      data = await res.json();
    } catch {
      /* No JSON body */
    }

    if (!res.ok) {
      const error = new Error(
        data?.message || `Request failed (${res.status})`,
      );

      error.status = res.status;
      throw error;
    }

    return data;
  });
};

const loadCurrentUser = async () => {
  if (!isSignedIn()) {
    return null;
  }

  try {
    const data = await apiFetch("/api/auth/me");

    if (data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Failed to load current user:", error);

    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    return null;
  }
};

/* =========================================================
PAGE LOADER
========================================================= */

const pageLoader = document.querySelector("#page-loader");

window.addEventListener("load", () => {
  window.setTimeout(() => {
    pageLoader?.classList.add("is-hidden");
    document.body.classList.add("page-ready");
  }, 450);
});

window.setTimeout(() => {
  pageLoader?.classList.add("is-hidden");
  document.body.classList.add("page-ready");
}, 2600);

/* =========================================================
BACK TO TOP
========================================================= */

const backToTop = document.querySelector("#back-to-top");

backToTop?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const updateBackToTop = () => {
  backToTop?.classList.toggle(
    "is-visible",
    window.scrollY > window.innerHeight * 0.65,
  );
};

window.addEventListener("scroll", updateBackToTop, {
  passive: true,
});

updateBackToTop();

/* =========================================================
NAV / SCROLL WIRING
========================================================= */

const scrollToSection = (id) => {
  const target = document.getElementById(id);

  if (!target) {
    return;
  }

  const nav = document.querySelector(".nav");
  const navHeight = nav?.offsetHeight || 0;

  const targetTop =
    target.getBoundingClientRect().top + window.scrollY - navHeight - 24;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });

  history.pushState(null, "", `#${id}`);
};

const focusCoach = () => {
  if (document.querySelector("#coach") && !isSignedIn()) {
    window.location.href = "signin.html";
    return;
  }

  scrollToSection("coach");

  window.setTimeout(() => {
    document.querySelector("#chat-input")?.focus();
  }, 500);
};

const closeMobileMenu = () => {
  const links = document.querySelector("#nav-links");

  links?.classList.remove("open");

  const menuButton = document.querySelector("#mobile-menu");

  if (!menuButton) {
    return;
  }

  menuButton.textContent = "Menu";
  menuButton.setAttribute("aria-expanded", "false");
};

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    scrollToSection(button.dataset.scroll);
    closeMobileMenu();
  });
});

document.querySelectorAll("[data-focus-coach]").forEach((button) => {
  button.addEventListener("click", focusCoach);
});

const menuButton = document.querySelector("#mobile-menu");

menuButton?.addEventListener("click", () => {
  const links = document.querySelector("#nav-links");

  if (!links) {
    return;
  }

  const open = links.classList.toggle("open");

  menuButton.textContent = open ? "Close" : "Menu";
  menuButton.setAttribute("aria-expanded", String(open));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  closeMobileMenu();
});

/* =========================================================
CHAT UI — MIRA
========================================================= */

const messages = document.querySelector("#chat-messages");
const input = document.querySelector("#chat-input");
const form = document.querySelector("#chat-form");
const suggestions = document.querySelector("#suggestions");

const createMessageBubble = (text, metaText) => {
  const bubble = document.createElement("div");

  bubble.className = "message";
  bubble.append(document.createTextNode(text));

  const meta = document.createElement("span");

  meta.className = "message-meta";
  meta.textContent = metaText;

  bubble.append(meta);

  return bubble;
};

const addMessage = (text, role) => {
  if (!messages) {
    return;
  }

  const row = document.createElement("div");

  row.className = `message-row ${role}`;

  if (role === "coach") {
    const avatar = document.createElement("div");

    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");

    avatar.innerHTML =
      '<svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M12 1C12.9 7.8 16.2 11.1 23 12C16.2 12.9 12.9 16.2 12 23C11.1 16.2 7.8 12.9 1 12C7.8 11.1 11.1 7.8 12 1Z"/>' +
      "</svg>";

    row.append(avatar, createMessageBubble(text, "MIRA · JUST NOW"));
  } else {
    row.append(createMessageBubble(text, "YOU · JUST NOW"));
  }

  messages.appendChild(row);

  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: "smooth",
  });
};

let miraConversationHistory = [];

const resizeInput = () => {
  if (!input) {
    return;
  }

  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 84)}px`;
};

const sendMessage = (text) => {
  if (!form || !input || !messages) {
    return;
  }

  const clean = text.trim();

  if (!clean || form.dataset.thinking === "true") {
    return;
  }

  form.dataset.thinking = "true";

  addMessage(clean, "user");

  input.value = "";
  resizeInput();

  suggestions?.remove();

  const typing = document.createElement("div");

  typing.className = "message-row";

  typing.innerHTML = `     <div class="message-avatar">       <svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true">         <path fill="currentColor" d="M12 1C12.9 7.8 16.2 11.1 23 12C16.2 12.9 12.9 16.2 12 23C11.1 16.2 7.8 12.9 1 12C7.8 11.1 11.1 7.8 12 1Z"/>       </svg>     </div>     <div class="message typing">       <i></i>       <i></i>       <i></i>     </div>
  `;

  messages.appendChild(typing);

  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: "smooth",
  });

  apiFetch("/api/mira/chat", {
    method: "POST",
    body: JSON.stringify({
      message: clean,
      history: miraConversationHistory,
    }),
  })
    .then((data) => {
      typing.remove();

      const reply = data.reply;

      addMessage(reply, "coach");

      miraConversationHistory.push(
        {
          role: "user",
          text: clean,
        },
        {
          role: "mira",
          text: reply,
        },
      );

      form.dataset.thinking = "false";
    })
    .catch((error) => {
      typing.remove();

      console.error("Mira API error:", error);

      addMessage(
        "I'm having a little trouble connecting right now. Give me a moment and try that again.",
        "coach",
      );

      form.dataset.thinking = "false";
    });
};

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (input) {
    sendMessage(input.value);
  }
});

input?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});

input?.addEventListener("input", resizeInput);

document.querySelectorAll(".prompt-chip").forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.textContent || "");
  });
});

/* =========================================================
MENTOR DIRECTORY
Loads real mentors from MongoDB
GET /api/mentors
========================================================= */

const mentorGrid = document.querySelector("#mentor-grid");

const createMentorCard = (mentor) => {
  const card = document.createElement("article");

  card.className = "mentor-card";
  card.dataset.tilt = "";

  const skills = Array.isArray(mentor.skills) ? mentor.skills.slice(0, 3) : [];

  const rating = mentor.stats?.rating || "—";
  const years = mentor.stats?.years || 0;
  const sessions = mentor.stats?.sessions || 0;

  const mentorId = mentor._id || mentor.id || "";

  card.innerHTML = ` <div class="mentor-card-top"> <div class="profile-avatar mentor-avatar">
${mentor.initials || "—"} </div>


  <div class="mentor-rating">
    <span>★</span>
    ${rating}
  </div>
</div>

<div class="mentor-card-body">
  <h3>${mentor.name || "Mentor"}</h3>

  <p class="mentor-role">
    ${mentor.roleLine || "Skill to Startup mentor"}
  </p>

  <p class="mentor-location">
    ${mentor.location || "Location not specified"}
  </p>

  <div class="mentor-skills">
    ${skills
      .map((skill) => `<span class="mentor-skill">${skill}</span>`)
      .join("")}
  </div>
</div>

<div class="mentor-card-footer">
  <div class="mentor-stats">
    <span>
      <strong>${sessions}</strong>
      sessions
    </span>

    <span>
      <strong>${years}</strong>
      ${years === 1 ? "year" : "years"}
    </span>
  </div>

  <a
    class="button button-quiet mentor-view-button"
    href="profile.html?view=mentor&id=${encodeURIComponent(mentorId)}"
  >
    View profile →
  </a>
</div>


`;

  return card;
};

const applyMentorCardEffects = () => {
  if (!mentorGrid) {
    return;
  }

  const cards = mentorGrid.querySelectorAll("[data-tilt]");

  cards.forEach((card) => {
    if (card.dataset.effectsReady === "true") {
      return;
    }

    card.dataset.effectsReady = "true";
    card.classList.add("reveal");

    card.addEventListener("pointermove", (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const rect = card.getBoundingClientRect();

      const x = (event.clientX - rect.left) / rect.width - 0.5;

      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);

      card.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);

      card.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);

      card.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });

  const mentorRevealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  cards.forEach((card) => {
    mentorRevealObserver.observe(card);
  });
};

const renderMentors = (mentors) => {
  if (!mentorGrid) {
    return;
  }

  mentorGrid.innerHTML = "";

  if (!mentors.length) {
    mentorGrid.innerHTML = `       <div class="mentor-loading">
        No mentors are available yet.       </div>
    `;

    return;
  }

  mentors.forEach((mentor) => {
    mentorGrid.appendChild(createMentorCard(mentor));
  });

  applyMentorCardEffects();
};

const loadMentors = () => {
  if (!mentorGrid) {
    return;
  }

  mentorGrid.innerHTML = `     <div class="mentor-loading">
      Loading mentors...     </div>
  `;

  apiFetch("/api/mentors")
    .then((data) => {
      renderMentors(data.mentors || []);
    })
    .catch((error) => {
      console.error("Failed to load mentors:", error);

      mentorGrid.innerHTML = `
    <div class="mentor-loading">
      <p>
        Couldn't load mentors right now.
      </p>

      <button
        type="button"
        class="button button-quiet"
        id="retry-mentors"
      >
        Try again
      </button>
    </div>
  `;

      document
        .querySelector("#retry-mentors")
        ?.addEventListener("click", loadMentors);
    });
};

loadMentors();

/* =========================================================
3D TILT EFFECT
========================================================= */

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = card.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;

    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);

    card.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);

    card.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);

    card.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

/* =========================================================
SCROLL PROGRESS BAR
========================================================= */

const progress = document.querySelector(".scroll-progress");

const syncScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  const amount = scrollable > 0 ? window.scrollY / scrollable : 0;

  progress?.style.setProperty("--progress", `${Math.min(amount, 1) * 100}%`);

  document.body.classList.toggle("has-scrolled", window.scrollY > 18);
};

window.addEventListener("scroll", syncScrollProgress, {
  passive: true,
});

syncScrollProgress();

/* =========================================================
SCROLL-TRIGGERED REVEALS
========================================================= */

const revealTargets = document.querySelectorAll(
  ".hero-copy, .coach-wrap, .logo-strip, .section-heading, .step, .sketch-board, .outcome-feature, .metric-card, .belief-art, .belief-copy, .cta-inner, .footer, .auth-panel, .auth-aside-top, .profile-card, .profile-sidebar, .profile-block",
);

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");

  element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 260)}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  },
);

revealTargets.forEach((element) => {
  revealObserver.observe(element);
});

/* =========================================================
ACTIVE NAV SECTION SPY
========================================================= */

const navSections = ["how-it-works", "outcomes", "mentors", "belief"];

const navLinks = document.querySelectorAll("[data-scroll]");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.dataset.scroll === entry.target.id,
        );
      });
    });
  },
  {
    threshold: 0,
    rootMargin: "-35% 0px -55% 0px",
  },
);

navSections.forEach((id) => {
  const section = document.getElementById(id);

  if (section) {
    sectionObserver.observe(section);
  }
});

/* =========================================================
AUTH FORMS — SIGNIN / SIGNUP
========================================================= */

document.querySelectorAll(".password-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.dataset.target;
    const field = document.getElementById(targetId);

    if (!field) {
      return;
    }

    const showing = field.type === "text";

    field.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
  });
});

const validateField = (field, checker, message) => {
  const wrap = field.closest(".field");
  const errorEl = wrap?.querySelector(".field-error");

  const valid = checker(field.value.trim());

  wrap?.classList.toggle("has-error", !valid);

  if (errorEl && message) {
    errorEl.textContent = message;
  }

  return valid;
};

const wireAuthForm = (formId, options) => {
  const authForm = document.getElementById(formId);

  if (!authForm) {
    return;
  }

  const statusEl = authForm.querySelector(".auth-status");
  const submitBtn = authForm.querySelector(".auth-submit");

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let allValid = true;

    authForm.querySelectorAll("[data-validate]").forEach((field) => {
      const rule = field.dataset.validate;

      let valid = true;
      let message = "This field looks off.";

      if (rule === "required") {
        valid = field.value.trim().length > 0;
        message = "This field can't be empty.";
      } else if (rule === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());

        message = "Enter a valid email address.";
      } else if (rule === "password") {
        valid = field.value.trim().length >= 8;
        message = "Use at least 8 characters.";
      } else if (rule === "match") {
        const matchField = document.getElementById(field.dataset.matches);

        valid = matchField ? field.value === matchField.value : true;

        message = "Passwords don't match.";
      }

      if (!validateField(field, () => valid, message)) {
        allValid = false;
      }
    });

    if (!allValid) {
      statusEl?.classList.remove("is-visible");
      return;
    }

    if (statusEl) {
      statusEl.classList.remove("is-error");
      statusEl.textContent = "Working on it…";
      statusEl.classList.add("is-visible");
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    apiFetch(options.endpoint, {
      method: "POST",
      body: JSON.stringify(options.buildPayload(authForm)),
    })
      .then((data) => {
        setSession(data.token, data.user);

        if (statusEl) {
          statusEl.textContent = options.successMessage;
        }

        authForm.reset();

        authForm.querySelectorAll(".field.has-error").forEach((field) => {
          field.classList.remove("has-error");
        });

        const redirectTo = options.getRedirect
          ? options.getRedirect(data.user)
          : null;

        if (redirectTo) {
          window.setTimeout(() => {
            window.location.href = redirectTo;
          }, 900);
        }
      })
      .catch((error) => {
        if (statusEl) {
          statusEl.textContent =
            error.message === "Failed to fetch"
              ? "Can't reach the server right now — is the backend running?"
              : error.message || "Something went wrong. Please try again.";

          statusEl.classList.add("is-visible", "is-error");
        }
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      });
  });

  authForm.querySelectorAll("[data-validate]").forEach((field) => {
    field.addEventListener("input", () => {
      field.closest(".field")?.classList.remove("has-error");
    });
  });
};

/* =========================================================
SIGN IN
========================================================= */

wireAuthForm("signin-form", {
  endpoint: "/api/auth/login",

  buildPayload: (form) => ({
    email: form.querySelector("#signin-email").value.trim(),

    password: form.querySelector("#signin-password").value,
  }),

  successMessage: "Signed in — taking you back in…",

  getRedirect: (user) =>
    user.role === "mentor" ? "mentor-dashboard.html" : "mentee-dashboard.html",
});

/* =========================================================
SIGN UP
========================================================= */

wireAuthForm("signup-form", {
  endpoint: "/api/auth/signup",

  buildPayload: (form) => ({
    name: form.querySelector("#signup-name").value.trim(),

    email: form.querySelector("#signup-email").value.trim(),

    password: form.querySelector("#signup-password").value,

    role:
      form.querySelector('input[name="account-role"]:checked')?.value ||
      "mentee",
  }),

  successMessage: "Account created — setting things up…",

  getRedirect: (user) =>
    user.role === "mentor" ? "mentor-dashboard.html" : "mentee-dashboard.html",
});

/* =========================================================
SIGN-UP ROLE TOGGLE
========================================================= */

const roleCopy = {
  mentee: {
    eyebrow: "For people finding their footing",

    heading: "Bring the skill. We'll help you find the offer.",

    body: "Answer a few honest questions and leave with a small, testable business idea — not a plan you'll shelve.",
  },

  mentor: {
    eyebrow: "For people who've done this before",

    heading: "Share what you know with someone building their first offer.",

    body: "Set your availability, pick the skills you coach on, and get matched with people ready to do the work.",
  },
};

const roleRadios = document.querySelectorAll('input[name="account-role"]');

roleRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    const copy = roleCopy[radio.value];

    if (!copy) {
      return;
    }

    const eyebrow = document.querySelector("[data-role-eyebrow]");

    const heading = document.querySelector("[data-role-heading]");

    const body = document.querySelector("[data-role-body]");

    if (eyebrow) {
      eyebrow.textContent = copy.eyebrow;
    }

    if (heading) {
      heading.textContent = copy.heading;
    }

    if (body) {
      body.textContent = copy.body;
    }
  });
});

/* =========================================================
PROFILE PAGE — MENTOR / MENTEE VIEW SWITCH
========================================================= */

const profileSwitchButtons = document.querySelectorAll("[data-profile-view]");

const profileViews = document.querySelectorAll("[data-profile-panel]");

const setProfileView = (view) => {
  profileSwitchButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileView === view);
  });

  profileViews.forEach((panel) => {
    panel.toggleAttribute("hidden", panel.dataset.profilePanel !== view);
  });
};

profileSwitchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setProfileView(button.dataset.profileView);
  });
});

const requestedProfileView = new URLSearchParams(window.location.search).get(
  "view",
);

if (requestedProfileView === "mentor" || requestedProfileView === "mentee") {
  setProfileView(requestedProfileView);
}

/* =========================================================
VIDEO CALL MODAL
========================================================= */

let videoCallOverlay = document.querySelector("#video-call-overlay");

const buildVideoCallModal = () => {
  const overlay = document.createElement("div");

  overlay.className = "modal-overlay call-modal";

  overlay.id = "video-call-overlay";

  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = ` <div class="coach-wrap"> <div class="coach-card">


    <button
      class="modal-close"
      type="button"
      id="video-call-close"
      aria-label="Close"
    >
      ✕
    </button>

    <div class="call-stage">
      <div>

        <div
          class="call-avatar-ring"
          id="video-call-avatar"
        >
          —
        </div>

        <p
          class="call-name"
          id="video-call-name"
        >
          —
        </p>

        <p
          class="call-status"
          id="video-call-status"
        >
          Requesting…
        </p>

      </div>
    </div>

    <div
      class="call-controls"
      id="video-call-controls"
    ></div>

  </div>
</div>


`;

  document.body.appendChild(overlay);

  return overlay;
};

const CALL_REQUEST_CONTROLS = `
<button
type="button"
class="call-btn end-call"
id="video-call-cancel"
aria-label="Cancel call request"

>


Cancel request


  </button>
`;

const CALL_LIVE_CONTROLS = `
<button
type="button"
class="call-btn is-active"
id="video-call-mic"
aria-label="Toggle microphone"

>


🎤


  </button>

<button
type="button"
class="call-btn is-active"
id="video-call-cam"
aria-label="Toggle camera"

>


📷


  </button>

<button
type="button"
class="call-btn end-call"
id="video-call-end"
aria-label="End call"

>


⏹


  </button>
`;

const openVideoCall = (event) => {
  const trigger = event?.currentTarget;

  const name = trigger?.dataset.callName || "them";

  const initials = trigger?.dataset.callInitials || "—";

  if (!videoCallOverlay) {
    videoCallOverlay = buildVideoCallModal();
  }

  const nameEl = videoCallOverlay.querySelector("#video-call-name");

  const avatarEl = videoCallOverlay.querySelector("#video-call-avatar");

  const statusEl = videoCallOverlay.querySelector("#video-call-status");

  const controlsEl = videoCallOverlay.querySelector("#video-call-controls");

  if (nameEl) {
    nameEl.textContent = name;
  }

  if (avatarEl) {
    avatarEl.textContent = initials;
  }

  statusEl?.classList.remove("is-connected");

  if (statusEl) {
    statusEl.textContent = `Requesting a video call with ${name}…`;
  }

  if (controlsEl) {
    controlsEl.innerHTML = CALL_REQUEST_CONTROLS;
  }

  videoCallOverlay.classList.add("is-open");

  videoCallOverlay.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";

  videoCallOverlay
    .querySelector("#video-call-close")
    ?.addEventListener("click", closeVideoCall, { once: true });

  videoCallOverlay
    .querySelector("#video-call-cancel")
    ?.addEventListener("click", closeVideoCall, { once: true });

  const acceptTimer = window.setTimeout(() => {
    if (!videoCallOverlay.classList.contains("is-open")) {
      return;
    }

    if (statusEl) {
      statusEl.textContent = "Connected · 00:0" + Math.floor(Math.random() * 9);

      statusEl.classList.add("is-connected");
    }

    if (controlsEl) {
      controlsEl.innerHTML = CALL_LIVE_CONTROLS;
    }

    videoCallOverlay
      .querySelector("#video-call-end")
      ?.addEventListener("click", closeVideoCall, { once: true });

    videoCallOverlay.querySelectorAll(".call-btn.is-active").forEach((btn) => {
      btn.onclick = () => {
        btn.classList.toggle("is-active");
      };
    });
  }, 2200);

  videoCallOverlay.dataset.acceptTimer = String(acceptTimer);
};

function closeVideoCall() {
  if (!videoCallOverlay) {
    return;
  }

  window.clearTimeout(Number(videoCallOverlay.dataset.acceptTimer));

  videoCallOverlay.classList.remove("is-open");

  videoCallOverlay.setAttribute("aria-hidden", "true");

  if (!document.querySelector(".modal-overlay.is-open")) {
    document.body.style.overflow = "";
  }
}

document.querySelectorAll("[data-open-video-call]").forEach((button) => {
  button.addEventListener("click", openVideoCall);
});

document.addEventListener("click", (event) => {
  if (event.target === videoCallOverlay) {
    closeVideoCall();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeVideoCall();
  }
});

/* =========================================================
MENTOR DASHBOARD
Backed by real /api/matches
========================================================= */

const menteeListEl = document.querySelector("#mentee-list");

const formatRelativeTime = (dateString) => {
  if (!dateString) {
    return "";
  }

  const diffMs = Date.now() - new Date(dateString).getTime();

  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) {
    return "now";
  }

  if (mins < 60) {
    return `${mins}m`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
};

if (menteeListEl) {
  let matches = [];
  let activeTab = "all";
  let searchTerm = "";
  let activeMatchId = null;

  const menteeOf = (match) => match.mentee;

  const matchMatchesTab = (match) => {
    if (activeTab === "requests") {
      return match.status === "pending";
    }

    if (activeTab === "unread") {
      return match.unreadCount > 0;
    }

    return match.status !== "declined";
  };

  const matchMatchesSearch = (match) => {
    const mentee = menteeOf(match);

    const blurb = `${mentee?.roleLine || ""} ${
      mentee?.focus?.focus || ""
    }`.toLowerCase();

    return (
      (mentee?.name || "").toLowerCase().includes(searchTerm) ||
      blurb.includes(searchTerm)
    );
  };

  const renderMenteeList = () => {
    menteeListEl.innerHTML = "";

    const visible = matches.filter(
      (m) => matchMatchesTab(m) && matchMatchesSearch(m),
    );

    if (visible.length === 0) {
      const empty = document.createElement("div");

      empty.className = "thread-empty";

      empty.innerHTML =
        "<p style='margin:0;font-size:0.84rem;'>No mentees match here yet.</p>";

      menteeListEl.appendChild(empty);

      return;
    }

    visible.forEach((match) => {
      const mentee = menteeOf(match);

      if (!mentee) {
        return;
      }

      const isUnread = match.unreadCount > 0;

      const row = document.createElement("button");

      row.type = "button";

      row.className = `mentee-row${
        match._id === activeMatchId ? " is-active" : ""
      }${isUnread ? " is-unread" : ""}`;

      const preview = match.lastMessage
        ? `${match.lastMessage.sentByMe ? "You: " : ""}${
            match.lastMessage.text
          }`
        : "No messages yet";

      row.innerHTML = `
    <div class="profile-avatar">
      ${mentee.initials || "—"}
    </div>

    <div class="mentee-row-body">

      <div class="mentee-row-top">
        <strong>
          ${mentee.name}
          ${isUnread ? '<span class="unread-dot"></span>' : ""}
        </strong>

        <span class="mentee-row-time">
          ${formatRelativeTime(match.lastMessage?.createdAt || match.updatedAt)}
        </span>
      </div>

      <div class="mentee-row-preview">
        ${preview}
      </div>

      ${
        match.status === "pending"
          ? `
            <div class="mentee-request-actions">

              <button
                type="button"
                class="accept-btn"
                data-accept="${match._id}"
              >
                Accept
              </button>

              <button
                type="button"
                class="decline-btn"
                data-decline="${match._id}"
              >
                Decline
              </button>

            </div>
          `
          : ""
      }

    </div>
  `;

      row.addEventListener("click", (event) => {
        if (event.target.closest("[data-accept], [data-decline]")) {
          return;
        }

        if (match.status === "pending") {
          return;
        }

        openMenteeThread(match._id);
      });

      menteeListEl.appendChild(row);
    });

    menteeListEl.querySelectorAll("[data-accept]").forEach((button) => {
      button.addEventListener("click", () => {
        apiFetch(`/api/matches/${button.dataset.accept}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "active",
          }),
        })
          .then(() => {
            loadMatches();
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    });

    menteeListEl.querySelectorAll("[data-decline]").forEach((button) => {
      button.addEventListener("click", () => {
        apiFetch(`/api/matches/${button.dataset.decline}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "declined",
          }),
        })
          .then(() => {
            if (activeMatchId === button.dataset.decline) {
              closeMenteeThread();
            }

            loadMatches();
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    });
  };

  const loadMatches = () => {
    apiFetch("/api/matches")
      .then((data) => {
        matches = data.matches || [];

        renderMenteeList();
      })
      .catch((error) => {
        menteeListEl.innerHTML = `
      <div class="thread-empty">
        <p style="margin:0;font-size:0.84rem;">
          Couldn't load your mentees —
          ${error.message}
        </p>
      </div>
    `;
      });
  };

  const threadEmpty = document.querySelector("#thread-empty-state");

  const threadActive = document.querySelector("#thread-active");

  const threadAvatar = document.querySelector("#thread-avatar");

  const threadName = document.querySelector("#thread-name");

  const threadMeta = document.querySelector("#thread-meta");

  const threadBody = document.querySelector("#thread-body");

  const threadForm = document.querySelector("#thread-form");

  const threadInput = document.querySelector("#thread-input");

  const threadViewProfile = document.querySelector("#thread-view-profile");

  const threadVideoCallBtn = document.querySelector("#thread-video-call");

  const renderThreadMessages = (messagesList) => {
    if (!threadBody) {
      return;
    }

    threadBody.innerHTML = "";

    const me = getCachedUser();

    messagesList.forEach((message) => {
      const isMe =
        String(message.sender) === String(me?._id) ||
        String(message.sender?._id) === String(me?._id);

      const row = document.createElement("div");

      row.className = `message-row ${isMe ? "user" : ""}`.trim();

      const bubble = document.createElement("div");

      bubble.className = "message";

      bubble.append(document.createTextNode(message.text));

      const meta = document.createElement("span");

      meta.className = "message-meta";

      meta.textContent = isMe ? "YOU" : "THEM";

      bubble.append(meta);

      if (!isMe) {
        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        avatar.textContent = "•";

        row.append(avatar, bubble);
      } else {
        row.append(bubble);
      }

      threadBody.appendChild(row);
    });

    threadBody.scrollTo({
      top: threadBody.scrollHeight,
      behavior: "smooth",
    });
  };

  function openMenteeThread(matchId) {
    const match = matches.find((m) => m._id === matchId);

    if (!match) {
      return;
    }

    const mentee = menteeOf(match);

    activeMatchId = matchId;

    if (threadEmpty) {
      threadEmpty.hidden = true;
    }

    if (threadActive) {
      threadActive.hidden = false;
    }

    if (threadAvatar) {
      threadAvatar.textContent = mentee?.initials || "—";
    }

    if (threadName) {
      threadName.textContent = mentee?.name || "—";
    }

    if (threadMeta) {
      threadMeta.textContent = `${mentee?.roleLine || ""}${
        mentee?.focus?.focus ? " · " + mentee.focus.focus : ""
      }`;
    }

    if (threadViewProfile) {
      threadViewProfile.href = `profile.html?view=mentee&id=${mentee?._id}`;
    }

    if (threadVideoCallBtn) {
      threadVideoCallBtn.dataset.callName = mentee?.name || "them";

      threadVideoCallBtn.dataset.callInitials = mentee?.initials || "—";
    }

    if (threadBody) {
      threadBody.innerHTML = `
    <div class="thread-empty">
      <p style="margin:0;font-size:0.84rem;">
        Loading conversation…
      </p>
    </div>
  `;
    }

    apiFetch(`/api/matches/${matchId}/messages`)
      .then((data) => {
        renderThreadMessages(data.messages || []);

        loadMatches();
      })
      .catch((error) => {
        if (threadBody) {
          threadBody.innerHTML = `
        <div class="thread-empty">
          <p style="margin:0;font-size:0.84rem;">
            Couldn't load messages —
            ${error.message}
          </p>
        </div>
      `;
        }
      });

    window.setTimeout(() => {
      threadInput?.focus();
    }, 150);
  }

  function closeMenteeThread() {
    activeMatchId = null;

    if (threadEmpty) {
      threadEmpty.hidden = false;
    }

    if (threadActive) {
      threadActive.hidden = true;
    }
  }

  threadForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = threadInput?.value.trim();

    if (!activeMatchId || !text) {
      return;
    }

    threadInput.value = "";
    threadInput.style.height = "auto";

    apiFetch(`/api/matches/${activeMatchId}/messages`, {
      method: "POST",

      body: JSON.stringify({
        text,
      }),
    })
      .then(() => {
        return apiFetch(`/api/matches/${activeMatchId}/messages`);
      })
      .then((data) => {
        renderThreadMessages(data.messages || []);

        loadMatches();
      })
      .catch((error) => {
        alert(error.message);
      });
  });

  threadInput?.addEventListener("input", () => {
    threadInput.style.height = "auto";

    threadInput.style.height = `${Math.min(threadInput.scrollHeight, 100)}px`;
  });

  threadInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      threadForm?.requestSubmit();
    }
  });

  document.querySelectorAll("[data-mentee-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.menteeTab;

      document.querySelectorAll("[data-mentee-tab]").forEach((btn) => {
        btn.classList.toggle("is-active", btn === button);
      });

      renderMenteeList();
    });
  });

  document
    .querySelector("#mentee-search")
    ?.addEventListener("input", (event) => {
      searchTerm = event.target.value.trim().toLowerCase();

      renderMenteeList();
    });

  loadMatches();
}

/* =========================================================
MIRA LOCK
Coach chat on index.html is gated behind sign-in.
========================================================= */

const coachSection = document.querySelector("#coach");

let renderCoachLock = null;

if (coachSection) {
  renderCoachLock = () => {
    let overlay = coachSection.querySelector(".coach-lock-overlay");

    if (isSignedIn()) {
      coachSection.classList.remove("is-locked");

      overlay?.remove();

      return;
    }

    coachSection.classList.add("is-locked");

    if (overlay) {
      return;
    }

    overlay = document.createElement("div");

    overlay.className = "coach-lock-overlay";

    overlay.innerHTML = `
  <div
    class="lock-icon"
    aria-hidden="true"
  >
    🔒
  </div>

  <p class="lock-title">
    Sign in to chat with Mira
  </p>

  <p class="lock-sub">
    Create a free account or sign in to start your first conversation.
  </p>

  <div class="lock-actions">
    <a
      class="button button-primary"
      href="signin.html"
    >
      Sign in
    </a>

    <a
      class="button button-quiet"
      href="signup.html"
    >
      Create account
    </a>
  </div>
`;

    coachSection.querySelector(".coach-card")?.appendChild(overlay);
  };

  renderCoachLock();
}

/* =========================================================
AUTH-AWARE NAV
Sign in/Get started ↔ Sign out
========================================================= */

const updateNavUser = (user) => {
  const avatar = document.querySelector("#nav-avatar");

  const profileLink = document.querySelector(".account-link");

  if (!avatar || !profileLink || !user) {
    return;
  }

  avatar.textContent = user.initials || "—";

  profileLink.title = user.name || "My profile";
};

const updateRoleBasedDashboardUI = (user) => {
  const dashboardLinks = document.querySelectorAll("[data-role-dashboard]");

  dashboardLinks.forEach((element) => {
    if (!user) {
      element.hidden = true;

      element.style.setProperty("display", "none", "important");

      return;
    }

    element.hidden = false;
    element.style.removeProperty("display");

    if (user.role === "mentor") {
      element.href = "mentor-dashboard.html";
    } else if (user.role === "mentee") {
      element.href = "mentee-dashboard.html";
    }
  });
};

/* =========================================================
ROLE-BASED MENTOR NAV
Mentors should not see Find mentors / Meet mentors.
========================================================= */

const updateRoleBasedMentorNav = (user) => {
  const mentorNavLinks = document.querySelectorAll(
    '[data-scroll="mentors"], a[href="mentors.html"]',
  );

  mentorNavLinks.forEach((element) => {
    if (user?.role === "mentor") {
      element.hidden = true;

      element.style.setProperty("display", "none", "important");
    } else {
      element.hidden = false;

      element.style.removeProperty("display");
    }
  });
};

function applyAuthNavState() {
  const navSignin = document.querySelector("#nav-signin");

  const navGetStarted = document.querySelector("#nav-getstarted");

  const navSignout = document.querySelector("#nav-signout");

  const signedIn = isSignedIn();

  if (navSignin) {
    navSignin.hidden = signedIn;

    if (signedIn) {
      navSignin.style.setProperty("display", "none", "important");
    } else {
      navSignin.style.removeProperty("display");
    }
  }

  if (navGetStarted) {
    navGetStarted.hidden = signedIn;

    if (signedIn) {
      navGetStarted.style.setProperty("display", "none", "important");
    } else {
      navGetStarted.style.removeProperty("display");
    }
  }

  if (navSignout) {
    navSignout.hidden = !signedIn;

    if (signedIn) {
      navSignout.style.removeProperty("display");
    } else {
      navSignout.style.setProperty("display", "none", "important");
    }
  }
}
/* =========================================================
NOTIFICATIONS
Backed by real /api/notifications
========================================================= */

const notificationWrap = document.querySelector("#notification-wrap");
const notificationButton = document.querySelector("#notification-button");
const notificationPanel = document.querySelector("#notification-panel");
const notificationList = document.querySelector("#notification-list");
const notificationBadge = document.querySelector("#notification-badge");
const notificationCountLabel = document.querySelector(
  "#notification-count-label",
);

let notificationRefreshTimer = null;
let notifications = [];

const formatNotificationTime = (dateString) => {
  if (!dateString) {
    return "";
  }

  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) {
    return "Just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(dateString).toLocaleDateString();
};

const updateNotificationBadge = () => {
  if (!notificationBadge || !notificationCountLabel) {
    return;
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  if (unreadCount > 0) {
    notificationBadge.textContent =
      unreadCount > 99 ? "99+" : String(unreadCount);

    notificationBadge.classList.add("is-visible");
    notificationCountLabel.textContent = `${unreadCount} unread`;
  } else {
    notificationBadge.textContent = "";
    notificationBadge.classList.remove("is-visible");
    notificationCountLabel.textContent = "0 unread";
  }
};

const renderNotifications = () => {
  if (!notificationList) {
    return;
  }

  notificationList.innerHTML = "";

  if (!notifications.length) {
    const empty = document.createElement("div");

    empty.className = "notification-empty";
    empty.textContent = "No notifications yet.";

    notificationList.appendChild(empty);

    updateNotificationBadge();

    return;
  }

  notifications.forEach((notification) => {
    const item = document.createElement("button");

    item.type = "button";
    item.className = "notification-item";

    if (!notification.read) {
      item.classList.add("is-unread");
    }

    const dot = document.createElement("span");

    dot.className = "notification-dot";
    dot.setAttribute("aria-hidden", "true");

    const body = document.createElement("span");

    body.className = "notification-item-body";

    const text = document.createElement("span");

    text.className = "notification-item-text";
    text.textContent = notification.text || "New notification";

    const time = document.createElement("span");

    time.className = "notification-item-time";
    time.textContent = formatNotificationTime(notification.createdAt);

    body.append(text, time);
    item.append(dot, body);

    item.addEventListener("click", () => {
      handleNotificationClick(notification);
    });

    notificationList.appendChild(item);
  });

  updateNotificationBadge();
};

const loadNotifications = async () => {
  if (!isSignedIn() || !notificationWrap) {
    notifications = [];
    renderNotifications();
    return;
  }

  try {
    const data = await apiFetch("/api/notifications");

    notifications = Array.isArray(data?.notifications)
      ? data.notifications
      : [];

    renderNotifications();
  } catch (error) {
    console.error("Failed to load notifications:", error);
  }
};

const markNotificationRead = async (notification) => {
  if (!notification?._id || notification.read) {
    return;
  }

  try {
    await apiFetch(`/api/notifications/${notification._id}/read`, {
      method: "PATCH",
    });

    notification.read = true;

    renderNotifications();
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
};

const handleNotificationClick = async (notification) => {
  await markNotificationRead(notification);

  const user = getCachedUser();

  if (notification.type === "match_requested") {
    window.location.href = "mentor-dashboard.html";
    return;
  }

  if (
    notification.type === "match_accepted" ||
    notification.type === "match_declined"
  ) {
    window.location.href = "mentee-dashboard.html";
    return;
  }

  if (notification.type === "new_message") {
    if (user?.role === "mentor") {
      window.location.href = "mentor-dashboard.html";
    } else if (user?.role === "mentee") {
      window.location.href = "mentee-dashboard.html";
    }

    return;
  }
};

const openNotificationPanel = () => {
  if (!notificationPanel || !notificationButton) {
    return;
  }

  notificationPanel.classList.add("is-open");
  notificationPanel.setAttribute("aria-hidden", "false");
  notificationButton.setAttribute("aria-expanded", "true");
};

const closeNotificationPanel = () => {
  if (!notificationPanel || !notificationButton) {
    return;
  }

  notificationPanel.classList.remove("is-open");
  notificationPanel.setAttribute("aria-hidden", "true");
  notificationButton.setAttribute("aria-expanded", "false");
};

notificationButton?.addEventListener("click", (event) => {
  event.stopPropagation();

  if (notificationPanel?.classList.contains("is-open")) {
    closeNotificationPanel();
  } else {
    openNotificationPanel();
    loadNotifications();
  }
});

document.addEventListener("click", (event) => {
  if (!notificationWrap || !notificationPanel) {
    return;
  }

  if (!notificationWrap.contains(event.target)) {
    closeNotificationPanel();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNotificationPanel();
  }
});

const startNotificationRefresh = () => {
  if (!notificationWrap || !isSignedIn()) {
    return;
  }

  loadNotifications();

  if (notificationRefreshTimer) {
    window.clearInterval(notificationRefreshTimer);
  }

  notificationRefreshTimer = window.setInterval(() => {
    if (isSignedIn()) {
      loadNotifications();
    }
  }, 30000);
};

const stopNotificationRefresh = () => {
  if (notificationRefreshTimer) {
    window.clearInterval(notificationRefreshTimer);
    notificationRefreshTimer = null;
  }

  notifications = [];
  renderNotifications();
  closeNotificationPanel();
};

/* =========================================================
INITIAL AUTH NAV STATE
========================================================= */

const cachedUser = getCachedUser();

updateRoleBasedDashboardUI(cachedUser);

updateRoleBasedMentorNav(cachedUser);

applyAuthNavState();

if (cachedUser) {
  updateNavUser(cachedUser);
}

loadCurrentUser().then((user) => {
  if (user) {
    updateNavUser(user);
  }

  updateRoleBasedDashboardUI(user);
  updateRoleBasedMentorNav(user);
  applyAuthNavState();

  if (typeof renderCoachLock === "function") {
    renderCoachLock();
  }

  if (user) {
    startNotificationRefresh();
  } else {
    stopNotificationRefresh();
  }
});

document.querySelectorAll("[data-sign-out]").forEach((el) => {
  el.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    stopNotificationRefresh();

    updateRoleBasedDashboardUI(null);
    updateRoleBasedMentorNav(null);
    applyAuthNavState();

    if (typeof renderCoachLock === "function") {
      renderCoachLock();
    }
  });
});

/* =========================================================
SMOOTH SAME-PAGE HASH NAVIGATION
========================================================= */

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href*="#"]');

  if (!link) {
    return;
  }

  const url = new URL(link.href, window.location.href);

  if (url.pathname !== window.location.pathname || !url.hash) {
    return;
  }

  const target = document.querySelector(url.hash);

  if (!target) {
    return;
  }

  event.preventDefault();

  scrollToSection(url.hash.substring(1));

  closeMobileMenu();
});

/* =========================================================
ACTIVE PAGE NAV
Used on inner pages such as:

* Dashboard
* Find mentors
* My profile
  ========================================================= */

const setActivePageNav = () => {
  const pageNavLinks = document.querySelectorAll(".nav-links .nav-link");

  if (!pageNavLinks.length) {
    return;
  }

  let currentPage = window.location.pathname.split("/").pop();

  if (!currentPage) {
    currentPage = "index.html";
  }

  pageNavLinks.forEach((link) => {
    if (link.hasAttribute("data-scroll")) {
      return;
    }

    const linkPage =
      new URL(link.href, window.location.href).pathname.split("/").pop() ||
      "index.html";

    link.classList.toggle("is-active", linkPage === currentPage);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setActivePageNav);
} else {
  setActivePageNav();
}

window.addEventListener("popstate", setActivePageNav);
