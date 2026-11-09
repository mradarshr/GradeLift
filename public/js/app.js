function getToken() {
    return localStorage.getItem("gradelift_token");
}

function setToken(token) {
    localStorage.setItem("gradelift_token", token);
}

function clearAuth() {
    localStorage.removeItem("gradelift_token");
    localStorage.removeItem("gradelift_user");
    sessionStorage.clear();
}

async function apiRequest(endpoint, method, body) {
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }
    var options = {
        method: method || "GET",
        headers: headers
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    var res = await fetch(endpoint, options);
    if (res.status === 401) {
        clearAuth();
        window.location.href = "login.html";
        return null;
    }
    var data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

async function checkLogin() {
    var token = getToken();
    if (!token && !sessionStorage.getItem("loggedIn")) {
        window.location.href = "login.html";
        return;
    }
    try {
        var res = await apiRequest("/api/auth/me");
        if (res && res.user) {
            sessionStorage.setItem("loggedIn", "true");
            sessionStorage.setItem("userName", res.user.name);
            localStorage.setItem("gradelift_user", JSON.stringify(res.user));
        }
    } catch (e) {
        clearAuth();
        window.location.href = "login.html";
    }
}

async function logout() {
    try {
        await apiRequest("/api/auth/logout", "POST");
    } catch (e) {
    }
    clearAuth();
    window.location.href = "login.html";
}

function getUser() {
    var userJson = localStorage.getItem("gradelift_user");
    if (userJson) {
        try {
            var u = JSON.parse(userJson);
            if (u && u.name) return u.name;
        } catch (e) {
        }
    }
    return sessionStorage.getItem("userName") || "Student";
}

function toggleSidebar() {
    var sidebar = document.querySelector(".sidebar");
    var overlay = document.querySelector(".sidebar-overlay");
    if (sidebar) {
        sidebar.classList.toggle("show");
    }
    if (overlay) {
        overlay.classList.toggle("show");
    }
}

function showToast(message, type) {
    type = type || "success";
    var container = document.getElementById("glToastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "glToastContainer";
        container.className = "toast-container-custom";
        document.body.appendChild(container);
    }

    var icon = "bi-check-circle-fill text-success";
    if (type === "danger") icon = "bi-exclamation-circle-fill text-danger";
    else if (type === "info") icon = "bi-info-circle-fill text-info";
    else if (type === "warning") icon = "bi-exclamation-triangle-fill text-warning";

    var toast = document.createElement("div");
    toast.className = "gl-toast toast-" + type;
    toast.innerHTML = '<i class="bi ' + icon + ' fs-5"></i><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
        toast.classList.add("show");
    }, 10);

    setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3200);
}

function setBtnLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add("btn-loading");
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> ' + (loadingText || "Processing...");
    } else {
        btn.disabled = false;
        btn.classList.remove("btn-loading");
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
        }
    }
}

function showNetworkError(containerId, retryFnName, message) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var errEl = document.getElementById(containerId + "_errorOverlay");
    if (!errEl) {
        errEl = document.createElement("div");
        errEl.id = containerId + "_errorOverlay";
        errEl.className = "network-error-card p-4 p-md-5 text-center rounded-4 border bg-white shadow-sm my-3";
    }
    errEl.innerHTML = '<i class="bi bi-wifi-off display-4 text-danger mb-3 d-inline-block"></i>' +
        '<h5 class="fw-bold text-dark">Data Loading Failed</h5>' +
        '<p class="text-muted small mx-auto mb-4" style="max-width: 420px;">' + (message || "Network Error: Could not connect to the database. Please check your connection and try again.") + '</p>' +
        '<button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="' + (retryFnName || "location.reload()") + '">' +
        '<i class="bi bi-arrow-clockwise me-1"></i> Retry Loading' +
        '</button>';
    container.parentNode.insertBefore(errEl, container);
    container.classList.add("d-none");
}

function hideNetworkError(containerId) {
    var errEl = document.getElementById(containerId + "_errorOverlay");
    if (errEl && errEl.parentNode) {
        errEl.parentNode.removeChild(errEl);
    }
    var container = document.getElementById(containerId);
    if (container) {
        container.classList.remove("d-none");
    }
}

function renderCountSpinner(isDark, isSmall) {
    var cls = isDark ? "count-spinner-dark" : "count-spinner";
    if (isSmall) cls += " count-spinner-sm";
    return '<span class="' + cls + '" role="status" aria-label="Loading count"></span>';
}

function setCountLoading(elementOrId, isDark, isSmall) {
    var el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (el) {
        el.innerHTML = renderCountSpinner(isDark, isSmall);
    }
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function setCookie(name, value, days) {
    days = days || 365;
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
}

function getTheme() {
    var cTheme = getCookie("gradelift_theme");
    if (cTheme === "dark" || cTheme === "light") {
        return cTheme;
    }
    var lTheme = localStorage.getItem("gradelift_theme");
    if (lTheme === "dark" || lTheme === "light") {
        return lTheme;
    }
    return "light";
}

function syncThemeUI(theme) {
    var isDark = theme === "dark";
    var switches = document.querySelectorAll(".theme-switch-checkbox");
    switches.forEach(function(sw) {
        sw.checked = isDark;
    });

    var icons = document.querySelectorAll(".theme-icon");
    icons.forEach(function(ic) {
        if (isDark) {
            ic.className = ic.className.replace(/bi-moon(-stars)?/g, "bi-sun-fill");
            if (!ic.classList.contains("bi-sun-fill")) {
                ic.classList.add("bi-sun-fill");
            }
            ic.classList.remove("bi-moon-stars");
            ic.classList.remove("bi-moon");
        } else {
            ic.className = ic.className.replace(/bi-sun(-fill)?/g, "bi-moon-stars");
            if (!ic.classList.contains("bi-moon-stars")) {
                ic.classList.add("bi-moon-stars");
            }
            ic.classList.remove("bi-sun-fill");
            ic.classList.remove("bi-sun");
        }
    });

    var labels = document.querySelectorAll(".theme-label");
    labels.forEach(function(lb) {
        lb.textContent = isDark ? "Light Mode" : "Dark Mode";
    });
}

function setTheme(theme) {
    if (theme !== "dark" && theme !== "light") theme = "light";
    setCookie("gradelift_theme", theme, 365);
    localStorage.setItem("gradelift_theme", theme);

    if (theme === "dark") {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        document.documentElement.setAttribute("data-theme", "dark");
        if (document.body) document.body.classList.add("dark-mode");
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        if (document.body) document.body.classList.remove("dark-mode");
    }

    syncThemeUI(theme);
    window.dispatchEvent(new CustomEvent("themechanged", { detail: { theme: theme } }));
}

function toggleTheme() {
    var current = getTheme();
    var next = current === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
}

(function() {
    var initialTheme = getTheme();
    document.documentElement.setAttribute("data-bs-theme", initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    if (document.body) {
        if (initialTheme === "dark") document.body.classList.add("dark-mode");
        else document.body.classList.remove("dark-mode");
    }
})();

window.addEventListener("DOMContentLoaded", function() {
    var initialTheme = getTheme();
    setTheme(initialTheme);
    autoInitPickers();
});

function format12HourTime(t) {
    if (!t) return "";
    t = String(t).trim();
    if (/am|pm/i.test(t)) return t;
    var parts = t.split(":");
    if (parts.length < 2) return t;
    var h = parseInt(parts[0], 10);
    var m = parts[1].slice(0, 2);
    if (isNaN(h)) return t;
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return (h12 < 10 ? "0" + h12 : h12) + ":" + m + " " + ampm;
}

function parseTimeToMinutes(t) {
    if (!t) return 0;
    t = String(t).trim().toLowerCase();
    var isPM = t.includes("pm");
    var isAM = t.includes("am");
    var clean = t.replace(/(am|pm)/g, "").trim();
    var parts = clean.split(":");
    var h = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
}

var activePickerPopover = null;

function closeActivePicker() {
    if (activePickerPopover && activePickerPopover.parentNode) {
        activePickerPopover.parentNode.removeChild(activePickerPopover);
    }
    activePickerPopover = null;
}

document.addEventListener("click", function(e) {
    if (activePickerPopover) {
        if (!activePickerPopover.contains(e.target) && !e.target.closest("[data-picker-input]")) {
            closeActivePicker();
        }
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeActivePicker();
    }
});

function positionPopover(popover, targetInput) {
    var rect = targetInput.getBoundingClientRect();
    var popoverHeight = 350;
    var top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight && rect.top > popoverHeight + 10) {
        top = Math.max(10, rect.top - popoverHeight - 6);
    }
    var left = rect.left;
    if (left + 330 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 340);
    }
    popover.style.position = "fixed";
    popover.style.top = top + "px";
    popover.style.left = left + "px";
    popover.style.zIndex = "2000";
}

function openDatePicker(inputEl) {
    closeActivePicker();
    if (!inputEl) return;

    var curVal = inputEl.value ? new Date(inputEl.value) : new Date();
    if (isNaN(curVal.getTime())) curVal = new Date();

    var viewYear = curVal.getFullYear();
    var viewMonth = curVal.getMonth();
    var selectedYMD = inputEl.value || "";

    var popover = document.createElement("div");
    popover.className = "gl-picker-popover";
    document.body.appendChild(popover);
    activePickerPopover = popover;
    positionPopover(popover, inputEl);

    function render() {
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        var firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
        var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        var daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        var today = new Date();
        var todayYMD = today.toISOString().split("T")[0];

        var html = '<div class="gl-picker-header">' +
            '<button type="button" class="gl-picker-nav-btn prev-btn"><i class="bi bi-chevron-left"></i></button>' +
            '<div class="gl-picker-title"><i class="bi bi-calendar3 text-primary"></i> ' + months[viewMonth] + ' ' + viewYear + '</div>' +
            '<button type="button" class="gl-picker-nav-btn next-btn"><i class="bi bi-chevron-right"></i></button>' +
            '</div>';

        html += '<div class="gl-picker-chips">' +
            '<button type="button" class="gl-picker-chip" data-quick="today">Today</button>' +
            '<button type="button" class="gl-picker-chip" data-quick="tomorrow">Tomorrow</button>' +
            '<button type="button" class="gl-picker-chip" data-quick="1w">+1 Week</button>' +
            '<button type="button" class="gl-picker-chip" data-quick="2w">+2 Weeks</button>' +
            '</div>';

        html += '<div class="gl-datepicker-weekdays">';
        daysOfWeek.forEach(function(d) {
            html += '<div>' + d + '</div>';
        });
        html += '</div>';

        html += '<div class="gl-datepicker-grid">';
        for (var i = firstDayIndex - 1; i >= 0; i--) {
            var prevDayNum = daysInPrevMonth - i;
            html += '<div class="gl-datepicker-day other-month">' + prevDayNum + '</div>';
        }

        for (var day = 1; day <= daysInMonth; day++) {
            var mStr = (viewMonth + 1) < 10 ? "0" + (viewMonth + 1) : (viewMonth + 1);
            var dStr = day < 10 ? "0" + day : day;
            var ymd = viewYear + "-" + mStr + "-" + dStr;
            var isSel = (ymd === selectedYMD);
            var isTod = (ymd === todayYMD);
            var cls = "gl-datepicker-day";
            if (isSel) cls += " selected";
            if (isTod) cls += " today";
            html += '<div class="' + cls + '" data-ymd="' + ymd + '">' + day + '</div>';
        }

        var totalCells = firstDayIndex + daysInMonth;
        var nextDays = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);
        for (var n = 1; n <= nextDays; n++) {
            html += '<div class="gl-datepicker-day other-month">' + n + '</div>';
        }
        html += '</div>';

        html += '<div class="gl-picker-footer mt-2">' +
            '<button type="button" class="btn btn-sm btn-link text-muted p-0 clear-btn">Clear</button>' +
            '<button type="button" class="btn btn-sm btn-primary rounded-pill px-3 py-1 close-btn">Done</button>' +
            '</div>';

        popover.innerHTML = html;

        popover.querySelector(".prev-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            viewMonth--;
            if (viewMonth < 0) {
                viewMonth = 11;
                viewYear--;
            }
            render();
        });

        popover.querySelector(".next-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            viewMonth++;
            if (viewMonth > 11) {
                viewMonth = 0;
                viewYear++;
            }
            render();
        });

        popover.querySelectorAll(".gl-picker-chip").forEach(function(chip) {
            chip.addEventListener("click", function(e) {
                e.stopPropagation();
                var q = chip.dataset.quick;
                var targetDate = new Date();
                if (q === "tomorrow") {
                    targetDate.setDate(targetDate.getDate() + 1);
                } else if (q === "1w") {
                    targetDate.setDate(targetDate.getDate() + 7);
                } else if (q === "2w") {
                    targetDate.setDate(targetDate.getDate() + 14);
                }
                var ymd = targetDate.toISOString().split("T")[0];
                selectDate(ymd);
            });
        });

        popover.querySelectorAll(".gl-datepicker-day[data-ymd]").forEach(function(el) {
            el.addEventListener("click", function(e) {
                e.stopPropagation();
                selectDate(el.dataset.ymd);
            });
        });

        popover.querySelector(".clear-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            inputEl.value = "";
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            closeActivePicker();
        });

        popover.querySelector(".close-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            closeActivePicker();
        });
    }

    function selectDate(ymd) {
        inputEl.value = ymd;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        closeActivePicker();
    }

    render();
}

function openTimePicker(inputEl) {
    closeActivePicker();
    if (!inputEl) return;

    var cur = (inputEl.value || "09:30 AM").trim();
    var isPM = /pm/i.test(cur);
    var cleanTime = cur.replace(/(am|pm)/i, "").trim();
    var timeParts = cleanTime.split(":");
    var selectedHour = parseInt(timeParts[0], 10) || 9;
    if (selectedHour > 12) {
        selectedHour = selectedHour % 12 || 12;
        isPM = true;
    }
    if (selectedHour === 0) selectedHour = 12;

    var selectedMin = timeParts[1] ? parseInt(timeParts[1], 10) : 30;
    if (isNaN(selectedMin)) selectedMin = 0;
    var selectedAmPm = isPM ? "PM" : "AM";

    var popover = document.createElement("div");
    popover.className = "gl-picker-popover";
    document.body.appendChild(popover);
    activePickerPopover = popover;
    positionPopover(popover, inputEl);

    function updateValue() {
        var hStr = selectedHour < 10 ? "0" + selectedHour : selectedHour;
        var mStr = selectedMin < 10 ? "0" + selectedMin : selectedMin;
        var val = hStr + ":" + mStr + " " + selectedAmPm;
        inputEl.value = val;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        render();
    }

    function render() {
        var hStr = selectedHour < 10 ? "0" + selectedHour : selectedHour;
        var mStr = selectedMin < 10 ? "0" + selectedMin : selectedMin;

        var html = '<div class="gl-picker-header">' +
            '<div class="gl-picker-title"><i class="bi bi-clock text-primary"></i> 12-Hour Time Picker</div>' +
            '<button type="button" class="btn-close btn-sm close-btn" aria-label="Close"></button>' +
            '</div>';

        html += '<div class="gl-timepicker-display">' +
            '<div class="gl-timepicker-timebox">' + hStr + ':' + mStr + '</div>' +
            '<div class="gl-timepicker-ampm-wrap">' +
            '<button type="button" class="gl-timepicker-ampm-btn ' + (selectedAmPm === "AM" ? "active" : "") + '" data-ampm="AM">AM</button>' +
            '<button type="button" class="gl-timepicker-ampm-btn ' + (selectedAmPm === "PM" ? "active" : "") + '" data-ampm="PM">PM</button>' +
            '</div>' +
            '</div>';

        html += '<div class="gl-picker-chips">' +
            '<button type="button" class="gl-picker-chip" data-preset="08:00 AM">8:00 AM</button>' +
            '<button type="button" class="gl-picker-chip" data-preset="09:30 AM">9:30 AM</button>' +
            '<button type="button" class="gl-picker-chip" data-preset="11:00 AM">11:00 AM</button>' +
            '<button type="button" class="gl-picker-chip" data-preset="01:30 PM">1:30 PM</button>' +
            '<button type="button" class="gl-picker-chip" data-preset="03:00 PM">3:00 PM</button>' +
            '<button type="button" class="gl-picker-chip" data-preset="05:00 PM">5:00 PM</button>' +
            '</div>';

        html += '<div class="gl-timepicker-section-label">Select Hour</div>';
        html += '<div class="gl-timepicker-hours-grid">';
        for (var h = 1; h <= 12; h++) {
            var hCls = "gl-timepicker-hour-btn" + (h === selectedHour ? " selected" : "");
            html += '<button type="button" class="' + hCls + '" data-hour="' + h + '">' + (h < 10 ? "0" + h : h) + '</button>';
        }
        html += '</div>';

        html += '<div class="gl-timepicker-section-label">Select Minutes</div>';
        html += '<div class="gl-timepicker-minutes-grid">';
        var minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        minuteSteps.forEach(function(m) {
            var mCls = "gl-timepicker-minute-btn" + (m === selectedMin ? " selected" : "");
            var displayM = m < 10 ? "0" + m : m;
            html += '<button type="button" class="' + mCls + '" data-min="' + m + '">' + displayM + '</button>';
        });
        html += '</div>';

        html += '<div class="gl-picker-footer">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary rounded-pill now-btn">Current Time</button>' +
            '<button type="button" class="btn btn-sm btn-primary rounded-pill px-3 fw-bold done-btn">Set Time</button>' +
            '</div>';

        popover.innerHTML = html;

        popover.querySelector(".close-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            closeActivePicker();
        });

        popover.querySelectorAll(".gl-timepicker-ampm-btn").forEach(function(btn) {
            btn.addEventListener("click", function(e) {
                e.stopPropagation();
                selectedAmPm = btn.dataset.ampm;
                updateValue();
            });
        });

        popover.querySelectorAll(".gl-picker-chip[data-preset]").forEach(function(chip) {
            chip.addEventListener("click", function(e) {
                e.stopPropagation();
                inputEl.value = chip.dataset.preset;
                inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                inputEl.dispatchEvent(new Event("change", { bubbles: true }));
                closeActivePicker();
            });
        });

        popover.querySelectorAll(".gl-timepicker-hour-btn").forEach(function(btn) {
            btn.addEventListener("click", function(e) {
                e.stopPropagation();
                selectedHour = parseInt(btn.dataset.hour, 10);
                updateValue();
            });
        });

        popover.querySelectorAll(".gl-timepicker-minute-btn").forEach(function(btn) {
            btn.addEventListener("click", function(e) {
                e.stopPropagation();
                selectedMin = parseInt(btn.dataset.min, 10);
                updateValue();
            });
        });

        popover.querySelector(".now-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            var now = new Date();
            var nh = now.getHours();
            selectedAmPm = nh >= 12 ? "PM" : "AM";
            selectedHour = nh % 12 || 12;
            selectedMin = Math.round(now.getMinutes() / 5) * 5;
            if (selectedMin >= 60) selectedMin = 55;
            updateValue();
        });

        popover.querySelector(".done-btn").addEventListener("click", function(e) {
            e.stopPropagation();
            closeActivePicker();
        });
    }

    render();
}

function autoInitPickers() {
    var dateInputs = document.querySelectorAll('input[type="date"], [data-picker="date"], #modalTaskDue, #examDateInput');
    dateInputs.forEach(function(inp) {
        inp.setAttribute("data-picker-input", "date");
        inp.type = "text";
        inp.readOnly = true;
        inp.style.cursor = "pointer";
        if (!inp.placeholder) inp.placeholder = "Click to choose date...";
        inp.addEventListener("click", function() { openDatePicker(inp); });
        inp.addEventListener("focus", function() { openDatePicker(inp); });

        var parentGroup = inp.closest(".input-group");
        if (parentGroup) {
            parentGroup.style.cursor = "pointer";
            parentGroup.querySelectorAll(".input-group-text").forEach(function(addon) {
                addon.style.cursor = "pointer";
                addon.addEventListener("click", function() { openDatePicker(inp); });
            });
        }
    });

    var timeInputs = document.querySelectorAll('input[type="time"], [data-picker="time"], #slotTime');
    timeInputs.forEach(function(inp) {
        inp.setAttribute("data-picker-input", "time");
        inp.type = "text";
        inp.readOnly = true;
        inp.style.cursor = "pointer";
        if (!inp.placeholder) inp.placeholder = "Click to choose 12-hour time (e.g. 09:30 AM)...";
        inp.addEventListener("click", function() { openTimePicker(inp); });
        inp.addEventListener("focus", function() { openTimePicker(inp); });

        var parentGroup = inp.closest(".input-group");
        if (parentGroup) {
            parentGroup.style.cursor = "pointer";
            parentGroup.querySelectorAll(".input-group-text").forEach(function(addon) {
                addon.style.cursor = "pointer";
                addon.addEventListener("click", function() { openTimePicker(inp); });
            });
        }
    });
}

document.addEventListener("shown.bs.modal", function() {
    autoInitPickers();
});
