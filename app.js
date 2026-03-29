import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection, serverTimestamp,
  getDocs, query, orderBy, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const page = document.body.dataset.page;

function qs(id) { return document.getElementById(id); }

function showMessage(id, msg, type = "success") {
  const el = qs(id);
  if (!el) return;
  el.classList.remove("hidden", "success", "error");
  el.classList.add(type);
  el.textContent = msg;
}

function safeError(err) {
  if (!err) return "Bilinmeyen hata";
  if (err.code) return `${err.code} — ${err.message}`;
  return err.message || String(err);
}

let app, auth, db;

try {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("firebase-config.js boş veya eksik. firebase-config.example.js dosyasını firebase-config.js olarak kopyalayıp doldur.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase bağlantısı başarılı");
} catch (err) {
  console.error("Firebase başlatılamadı:", err);
  window.addEventListener("DOMContentLoaded", () => {
    const targets = ["registerMessage", "loginMessage", "debugMessage"];
    targets.forEach(id => {
      const el = qs(id);
      if (el) showMessage(id, "Firebase başlatılamadı: " + safeError(err), "error");
    });
  });
}

async function registerPage() {
  const form = qs("registerForm");
  if (!form || !auth || !db) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = qs("fullName").value.trim();
    const email = qs("email").value.trim();
    const password = qs("password").value.trim();
    const twitterUsername = qs("twitterUsername").value.trim();
    const telegramUsername = qs("telegramUsername").value.trim();
    const walletAddress = qs("terraWallet").value.trim();

    if (!name || !email || !password || !twitterUsername || !telegramUsername || !walletAddress) {
      showMessage("registerMessage", "Tüm alanlar zorunlu.", "error");
      return;
    }

    if (!walletAddress.startsWith("terra")) {
      showMessage("registerMessage", "Cüzdan adresi terra ile başlamalı.", "error");
      return;
    }

    try {
      showMessage("registerMessage", "Kayıt oluşturuluyor...", "success");

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        username: email.split("@")[0],
        twitterUsername,
        telegramUsername,
        walletAddress,
        points: 0,
        ustcBalance: 0,
        completedTasks: 0,
        role: "user",
        createdAt: serverTimestamp()
      });

      showMessage("registerMessage", "Kayıt başarılı. Panel sayfasına yönlendiriliyorsun.", "success");
      setTimeout(() => {
        location.href = "dashboard.html";
      }, 1200);
    } catch (err) {
      console.error("Kayıt hatası:", err);
      showMessage("registerMessage", safeError(err), "error");
    }
  });
}

async function loginPage() {
  const form = qs("loginForm");
  if (!form || !auth) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = qs("loginEmail").value.trim();
    const password = qs("loginPassword").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("loginMessage", "Giriş başarılı. Panel açılıyor.", "success");
      setTimeout(() => location.href = "dashboard.html", 900);
    } catch (err) {
      console.error("Giriş hatası:", err);
      showMessage("loginMessage", safeError(err), "error");
    }
  });
}

function taskCard(task) {
  return `
  <article class="task-item">
    <div>
      <h3 class="task-title">${task.title || "-"}</h3>
      <p class="task-desc">${task.description || ""}</p>
    </div>
    <div class="task-meta">
      <div class="reward-box">
        <span>Ödül</span>
        <strong>${Number(task.reward || 0).toFixed(2)} USTC</strong>
      </div>
      <div class="points-box">
        <div class="puan-logo"><img src="assets/htp-logo.png" alt="HTP" /></div>
        <div>
          <span>Puan</span>
          <strong>${task.points || 0}</strong>
        </div>
      </div>
      <a class="btn btn-primary" href="${task.link || "#"}" target="_blank">Göreve Git</a>
    </div>
  </article>`;
}

async function dashboardPage() {
  if (!auth || !db) return;

  const logoutBtn = qs("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      location.href = "login.html";
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        qs("welcomeText").textContent = "Auth hesabı var ama Firestore users kaydı yok.";
        return;
      }

      const u = userSnap.data();
      qs("welcomeText").textContent = `${u.name || "Kullanıcı"}, hesabın yüklendi.`;
      qs("pointsValue").textContent = u.points || 0;
      qs("ustcBalance").textContent = `${Number(u.ustcBalance || 0).toFixed(2)} USTC`;
      qs("completedTaskCount").textContent = u.completedTasks || 0;
      qs("walletValue").textContent = u.walletAddress || "-";

      const taskList = qs("taskList");
      const taskSnap = await getDocs(query(collection(db, "tasks"), orderBy("createdAt", "desc")));
      taskList.innerHTML = taskSnap.empty
        ? `<div class="empty-box">Henüz görev yok.</div>`
        : taskSnap.docs.map(d => taskCard(d.data())).join("");
    } catch (err) {
      console.error("Dashboard hatası:", err);
      qs("welcomeText").textContent = safeError(err);
    }
  });

  const withdrawForm = qs("withdrawForm");
  if (withdrawForm) {
    withdrawForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = Number(qs("withdrawAmount").value || 0);
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const u = userSnap.data();

        if (amount <= 0) {
          showMessage("withdrawMessage", "Geçerli bir miktar gir.", "error");
          return;
        }

        if (amount > Number(u.ustcBalance || 0)) {
          showMessage("withdrawMessage", "Bakiyeden fazla çekim talebi gönderemezsin.", "error");
          return;
        }

        await addDoc(collection(db, "withdrawals"), {
          userId: user.uid,
          fullName: u.name || "",
          email: u.email || "",
          wallet: u.walletAddress || "",
          amount,
          status: "pending",
          createdAt: serverTimestamp()
        });

        showMessage("withdrawMessage", "Çekim talebi gönderildi.", "success");
        withdrawForm.reset();
      } catch (err) {
        console.error("Çekim hatası:", err);
        showMessage("withdrawMessage", safeError(err), "error");
      }
    });
  }
}

function userCard(u) {
  return `
  <div class="admin-item">
    <h4>${u.name || "İsimsiz Kullanıcı"}</h4>
    <p>${u.email || "-"}</p>
    <p>Kullanıcı adı: ${u.username || "-"}</p>
    <p>Twitter: ${u.twitterUsername || "-"}</p>
    <p>Telegram: ${u.telegramUsername || "-"}</p>
    <p>Cüzdan: ${u.walletAddress || "-"}</p>
    <p>Puan: ${u.points || 0} | USTC: ${Number(u.ustcBalance || 0).toFixed(2)}</p>
  </div>`;
}

function withdrawalCard(id, w) {
  return `
  <div class="admin-item">
    <h4>${w.fullName || "Kullanıcı"}</h4>
    <p>E-posta: ${w.email || "-"}</p>
    <p>Cüzdan: ${w.wallet || "-"}</p>
    <p>Miktar: ${Number(w.amount || 0).toFixed(2)} USTC</p>
    <p>Durum: ${w.status || "pending"}</p>
    ${w.status === "pending" ? `
      <div class="admin-actions">
        <button class="btn-approve" data-action="approve" data-id="${id}">Onayla</button>
        <button class="btn-reject" data-action="reject" data-id="${id}">Reddet</button>
      </div>` : ``}
  </div>`;
}

async function loadUsers() {
  const box = qs("usersList");
  if (!box) return;
  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
    box.innerHTML = snap.empty
      ? `<div class="empty-box">Henüz kullanıcı yok.</div>`
      : snap.docs.map(d => userCard(d.data())).join("");
  } catch (err) {
    box.innerHTML = `<div class="empty-box">${safeError(err)}</div>`;
  }
}

async function loadWithdrawals() {
  const box = qs("withdrawalsList");
  if (!box) return;
  try {
    const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("createdAt", "desc")));
    box.innerHTML = snap.empty
      ? `<div class="empty-box">Bekleyen çekim talebi yok.</div>`
      : snap.docs.map(d => withdrawalCard(d.id, d.data())).join("");
  } catch (err) {
    box.innerHTML = `<div class="empty-box">${safeError(err)}</div>`;
  }
}

async function adminPage() {
  if (!auth || !db) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }

    try {
      const meSnap = await getDoc(doc(db, "users", user.uid));
      if (!meSnap.exists() || meSnap.data().role !== "admin") {
        document.querySelector(".admin-grid").innerHTML = `<div class="glass panel-card"><h1>Yetkisiz erişim</h1><p>Bu sayfa yalnızca admin içindir.</p></div>`;
        return;
      }
      loadUsers();
      loadWithdrawals();
    } catch (err) {
      document.querySelector(".admin-grid").innerHTML = `<div class="glass panel-card"><p>${safeError(err)}</p></div>`;
    }
  });

  const taskForm = qs("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await addDoc(collection(db, "tasks"), {
          title: qs("taskTitle").value.trim(),
          platform: qs("taskPlatform").value,
          description: qs("taskDescription").value.trim(),
          reward: Number(qs("taskReward").value || 0),
          points: Number(qs("taskPoints").value || 0),
          link: qs("taskLink").value.trim(),
          createdAt: serverTimestamp()
        });
        showMessage("taskMessage", "Görev eklendi.", "success");
        taskForm.reset();
      } catch (err) {
        showMessage("taskMessage", safeError(err), "error");
      }
    });
  }

  document.body.addEventListener("click", async (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    try {
      const withdrawalRef = doc(db, "withdrawals", id);
      const withdrawalSnap = await getDoc(withdrawalRef);
      if (!withdrawalSnap.exists()) return;
      const w = withdrawalSnap.data();

      if (action === "approve") {
        await updateDoc(withdrawalRef, { status: "approved" });

        const userRef = doc(db, "users", w.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const newBalance = Math.max(0, Number(userData.ustcBalance || 0) - Number(w.amount || 0));
        await updateDoc(userRef, { ustcBalance: newBalance });

        await loadWithdrawals();
        await loadUsers();
      }

      if (action === "reject") {
        await updateDoc(withdrawalRef, { status: "rejected" });
        await loadWithdrawals();
      }
    } catch (err) {
      alert(safeError(err));
    }
  });
}

async function debugPage() {
  const btn = qs("debugTestBtn");
  if (!btn || !auth || !db) return;

  btn.addEventListener("click", async () => {
    try {
      showMessage("debugMessage", "Firebase bağlandı. Auth ve Firestore hazır görünüyor.", "success");
    } catch (err) {
      showMessage("debugMessage", safeError(err), "error");
    }
  });
}

if (page === "register") registerPage();
if (page === "login") loginPage();
if (page === "dashboard") dashboardPage();
if (page === "admin") adminPage();
if (page === "debug") debugPage();
