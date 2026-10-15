const toId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (typeof value._id === 'string') return value._id;
        if (typeof value.$oid === 'string') return value.$oid;
        if (value._id && typeof value._id.toString === 'function') return value._id.toString();
        if (typeof value.toString === 'function') return value.toString();
    }
    return String(value);
};

const myId = "65d6c8e39f3a2b0012345678";
const projects = [
    { _id: "proj1", user: "65d6c8e39f3a2b0012345678", awardedTo: null, status: "open" },
    { _id: "proj2", user: { _id: "65d6c8e39f3a2b0012345678" }, awardedTo: null, status: "open" },
    { _id: "proj3", user: "other", awardedTo: { $oid: "65d6c8e39f3a2b0012345678" }, status: "awarded" }
];

const posted = projects.filter(p => toId(p.user) === myId);
const working = projects.filter(p => toId(p.awardedTo) === myId && p.status === 'awarded');

console.log("Posted:", posted.length);
console.log("Working:", working.length);
