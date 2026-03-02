const API_URL = "http://localhost:5000/api/posts";

const form = document.getElementById("postForm");
const postsDiv = document.getElementById("posts");

//  CREATE POST

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", document.getElementById("title").value);
    formData.append("desc", document.getElementById("desc").value);


    const selectedTag = document.getElementById("tagSelect").value;
    if (selectedTag) {
        formData.append("tags", selectedTag);
    }

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }

    await fetch(API_URL, {
        method: "POST",
        body: formData
    });

    form.reset();
    loadPosts();
});


//  LOAD POSTS


async function loadPosts() {
    const res = await fetch(API_URL);
    const data = await res.json();

    postsDiv.innerHTML = "";

    data.data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        const tagNames = post.tags && post.tags.length
            ? post.tags.map(tag => tag.name).join(", ")
            : "No Tags";

        div.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.desc}</p>
            ${post.image ? `<img src="${post.image}" width="200" />` : ""}
            <p><strong>Tags:</strong> ${tagNames}</p>
            <button onclick="deletePost('${post._id}')">Delete</button>
        `;

        postsDiv.appendChild(div);
    });
}


//  DELETE POST


async function deletePost(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
    loadPosts();
}


// SEARCH POSTS

async function searchPosts() {
    const keyword = document.getElementById("searchInput").value;

    if (!keyword) return;

    const res = await fetch(`http://localhost:5000/api/posts/search?keyword=${keyword}`);
    const data = await res.json();

    postsDiv.innerHTML = "";

    data.data.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        const tagNames = post.tags && post.tags.length
            ? post.tags.map(tag => tag.name).join(", ")
            : "No Tags";

        div.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.desc}</p>
            ${post.image ? `<img src="${post.image}" width="200" />` : ""}
            <p><strong>Tags:</strong> ${tagNames}</p>
            <button onclick="deletePost('${post._id}')">Delete</button>
        `;

        postsDiv.appendChild(div);
    });
}


// LOAD TAGS INTO DROPDOWN


async function loadTags() {
    const response = await fetch("http://localhost:5000/api/tags");
    const result = await response.json();

    const tagSelect = document.getElementById("tagSelect");
    tagSelect.innerHTML = '<option value="">Select Tag</option>';

    result.data.forEach(tag => {
        const option = document.createElement("option");
        option.value = tag.name;
        option.textContent = tag.name;
        tagSelect.appendChild(option);
    });
}

// INIT

document.addEventListener("DOMContentLoaded", () => {
    loadTags();
    loadPosts();
});