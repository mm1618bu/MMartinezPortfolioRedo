import React, { useMemo, useState } from "react";

/**
 * TicketDiscussion - a self-contained discussion post + help desk ticket.
 * - Create/edit core ticket fields (title, description, status, priority, tags, assignee)
 * - Add comments (Public or Internal) with role (User/Agent)
 * - Toggle show/hide internal notes
 * - Local-only state (no backend)
 */
export default function TicketDiscussion() {
  // ---------- Utilities ----------
  const uid = () => Math.random().toString(36).slice(2, 10);
  const nowISO = () => new Date().toISOString();
  const fmt = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ---------- Component State ----------
  const [ticket, setTicket] = useState({
    id: uid(),
    title: "",
    description: "",
    status: "Open",
    priority: "Medium",
    category: "General",
    assignee: "",
    tags: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });

  const [newTag, setNewTag] = useState("");
  const [formTouched, setFormTouched] = useState(false);

  const [comments, setComments] = useState([
    {
      id: uid(),
      author: "Mitchell",
      role: "User", // "User" | "Agent"
      visibility: "Public", // "Public" | "Internal"
      body: "Hey team, I’m seeing an intermittent error when submitting forms.",
      createdAt: nowISO(),
    },
  ]);

  const [draft, setDraft] = useState({
    author: "Agent",
    role: "Agent",
    visibility: "Public",
    body: "",
  });

  const [showInternal, setShowInternal] = useState(false);

  // ---------- Derived ----------
  const visibleComments = useMemo(
    () =>
      comments.filter((c) => (showInternal ? true : c.visibility === "Public")),
    [comments, showInternal]
  );

  // ---------- Handlers: Ticket ----------
  const setField = (key, value) => {
    setTicket((t) => ({
      ...t,
      [key]: value,
      updatedAt: nowISO(),
    }));
    setFormTouched(true);
  };

  const addTag = () => {
    const v = newTag.trim();
    if (!v) return;
    if (ticket.tags.includes(v)) {
      setNewTag("");
      return;
    }
    setTicket((t) => ({ ...t, tags: [...t.tags, v], updatedAt: nowISO() }));
    setNewTag("");
    setFormTouched(true);
  };

  const removeTag = (tag) => {
    setTicket((t) => ({
      ...t,
      tags: t.tags.filter((x) => x !== tag),
      updatedAt: nowISO(),
    }));
    setFormTouched(true);
  };

  // ---------- Handlers: Comments ----------
  const addComment = () => {
    const body = draft.body.trim();
    if (!body) return;
    const c = {
      id: uid(),
      author: draft.author || (draft.role === "Agent" ? "Agent" : "User"),
      role: draft.role,
      visibility: draft.visibility,
      body,
      createdAt: nowISO(),
    };
    setComments((cs) => [c, ...cs]);
    setDraft((d) => ({ ...d, body: "" }));
  };

  const deleteComment = (id) => {
    setComments((cs) => cs.filter((c) => c.id !== id));
  };

  // ---------- Inline Styles ----------
  const styles = {
    page: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      background: "#0b1220",
      minHeight: "100vh",
      color: "#e8eefb",
      padding: 20,
    },
    container: {
      maxWidth: 980,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gap: 16,
    },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    },
    headerBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      borderRadius: 999,
      padding: "6px 10px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    row: { display: "flex", gap: 12, flexWrap: "wrap" },
    field: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
    label: { fontSize: 12, opacity: 0.85 },
    input: {
      background: "rgba(255,255,255,0.06)",
      color: "#eef4ff",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      padding: "10px 12px",
      outline: "none",
    },
    textarea: {
      background: "rgba(255,255,255,0.06)",
      color: "#eef4ff",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      padding: "12px 12px",
      minHeight: 120,
      outline: "none",
      resize: "vertical",
      lineHeight: 1.5,
    },
    select: {
      background: "rgba(255,255,255,0.06)",
      color: "#eef4ff",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      padding: "10px 12px",
      outline: "none",
    },
    tagRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      borderRadius: 999,
      padding: "6px 10px",
      background: "rgba(125,140,255,0.12)",
      border: "1px solid rgba(125,140,255,0.28)",
    },
    tagRemove: {
      cursor: "pointer",
      opacity: 0.9,
    },
    buttonRow: { display: "flex", gap: 10, flexWrap: "wrap" },
    button: {
      borderRadius: 10,
      padding: "10px 14px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#e8eefb",
      cursor: "pointer",
    },
    buttonPrimary: {
      borderRadius: 10,
      padding: "10px 14px",
      border: "1px solid rgba(99,138,255,0.5)",
      background:
        "linear-gradient(180deg, rgba(108,142,255,0.55), rgba(108,142,255,0.35))",
      color: "#0b1220",
      fontWeight: 600,
      cursor: "pointer",
    },
    subtle: { fontSize: 12, opacity: 0.75 },
    divider: {
      height: 1,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.12), rgba(255,255,255,0))",
      margin: "14px 0",
      border: "none",
    },
    commentItem: {
      display: "grid",
      gridTemplateColumns: "44px 1fr",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 10,
      background:
        "radial-gradient(100% 100% at 30% 20%, #92a9ff, #6c8eff, #4058ff)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0b1220",
      fontWeight: 800,
    },
    commentHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
      flexWrap: "wrap",
    },
    commentBody: { whiteSpace: "pre-wrap", lineHeight: 1.5 },
    chipAgent: {
      ...{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      },
      background: "rgba(140, 255, 210, 0.15)",
      border: "1px solid rgba(140,255,210,0.35)",
      color: "#aef7d9",
    },
    chipUser: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: "rgba(255, 255, 255, 0.06)",
      border: "1px solid rgba(255,255,255,0.18)",
      color: "#e8eefb",
    },
    chipInternal: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      background: "rgba(255, 190, 90, 0.15)",
      border: "1px solid rgba(255, 190, 90, 0.35)",
      color: "#ffddaa",
    },
    sidebarSection: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 12,
    },
    kbd: {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderBottomColor: "rgba(255,255,255,0.35)",
      borderRadius: 6,
      padding: "2px 6px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
    },
  };

  // ---------- Render ----------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Main column */}
        <section style={styles.card} aria-label="Ticket Editor">
          <div style={styles.headerBar}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={styles.pill}>Ticket ID: {ticket.id}</span>
              <span style={styles.pill}>Created: {fmt(ticket.createdAt)}</span>
              <span style={styles.pill}>Updated: {fmt(ticket.updatedAt)}</span>
            </div>
            <span style={styles.subtle}>
              {formTouched ? "Unsaved changes (local)" : "All changes local"}
            </span>
          </div>

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              style={styles.input}
              placeholder="Describe the issue or topic..."
              value={ticket.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </div>

          {/* Description */}
          <div style={{ ...styles.field, marginTop: 10 }}>
            <label style={styles.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              style={styles.textarea}
              placeholder="Add details, steps to reproduce, expectations…"
              value={ticket.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          {/* Meta Row */}
          <div style={{ ...styles.row, marginTop: 10 }}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                style={styles.select}
                value={ticket.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Waiting on User</option>
                <option>Blocked</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                style={styles.select}
                value={ticket.priority}
                onChange={(e) => setField("priority", e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="category">
                Category
              </label>
              <select
                id="category"
                style={styles.select}
                value={ticket.category}
                onChange={(e) => setField("category", e.target.value)}
              >
                <option>General</option>
                <option>Bug</option>
                <option>Feature Request</option>
                <option>Account</option>
                <option>Billing</option>
                <option>Infrastructure</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="assignee">
                Assignee
              </label>
              <input
                id="assignee"
                style={styles.input}
                placeholder="Name or email…"
                value={ticket.assignee}
                onChange={(e) => setField("assignee", e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div style={{ ...styles.field, marginTop: 10 }}>
            <label style={styles.label}>Tags</label>
            <div style={styles.tagRow}>
              {ticket.tags.map((t) => (
                <span key={t} style={styles.tag}>
                  {t}
                  <span
                    role="button"
                    aria-label={`Remove ${t}`}
                    style={styles.tagRemove}
                    onClick={() => removeTag(t)}
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                style={{ ...styles.input, maxWidth: 220 }}
                placeholder="Add tag and press Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTag();
                }}
              />
              <button style={styles.button} onClick={addTag}>
                Add
              </button>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Comment Composer */}
          <div aria-label="Comment Composer">
            <div style={styles.row}>
              <div style={{ ...styles.field, maxWidth: 160 }}>
                <label style={styles.label} htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  style={styles.select}
                  value={draft.role}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, role: e.target.value }))
                  }
                >
                  <option>User</option>
                  <option>Agent</option>
                </select>
              </div>

              <div style={{ ...styles.field, maxWidth: 200 }}>
                <label style={styles.label} htmlFor="visibility">
                  Visibility
                </label>
                <select
                  id="visibility"
                  style={styles.select}
                  value={draft.visibility}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, visibility: e.target.value }))
                  }
                >
                  <option>Public</option>
                  <option>Internal</option>
                </select>
              </div>

              <div style={{ ...styles.field, maxWidth: 220 }}>
                <label style={styles.label} htmlFor="author">
                  Display Name
                </label>
                <input
                  id="author"
                  style={styles.input}
                  placeholder="e.g., Jordan (Support)"
                  value={draft.author}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, author: e.target.value }))
                  }
                />
              </div>
            </div>

            <div style={{ ...styles.field, marginTop: 10 }}>
              <label style={styles.label} htmlFor="commentBody">
                Comment
              </label>
              <textarea
                id="commentBody"
                style={styles.textarea}
                placeholder={
                  draft.visibility === "Internal"
                    ? "Add an internal note (not visible to the user)…"
                    : "Write a reply visible to everyone…"
                }
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addComment();
                }}
              />
            </div>

            <div style={{ ...styles.buttonRow, marginTop: 8 }}>
              <button style={styles.buttonPrimary} onClick={addComment}>
                Post Comment ⏎
              </button>
              <button
                style={styles.button}
                onClick={() => setDraft((d) => ({ ...d, body: "" }))}
              >
                Clear
              </button>
              <span style={styles.subtle}>
                Tip: Press <kbd style={styles.kbd}>Ctrl/⌘ + Enter</kbd> to post
              </span>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Comments List */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Thread</h3>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={showInternal}
                onChange={(e) => setShowInternal(e.target.checked)}
              />
              <span style={styles.subtle}>Show internal notes</span>
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {visibleComments.length === 0 ? (
              <div style={styles.subtle}>No comments yet.</div>
            ) : (
              visibleComments.map((c) => (
                <article key={c.id} style={styles.commentItem}>
                  <div style={styles.avatar}>
                    {String(c.author || c.role || "?")
                      .trim()
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.commentHead}>
                      <strong>{c.author || c.role}</strong>
                      {c.role === "Agent" ? (
                        <span style={styles.chipAgent}>Agent</span>
                      ) : (
                        <span style={styles.chipUser}>User</span>
                      )}
                      {c.visibility === "Internal" && (
                        <span title="Internal note" style={styles.chipInternal}>
                          Internal
                        </span>
                      )}
                      <span style={styles.subtle}>• {fmt(c.createdAt)}</span>
                      <button
                        style={{ ...styles.button, padding: "6px 10px", marginLeft: "auto" }}
                        onClick={() => deleteComment(c.id)}
                        aria-label="Delete comment"
                        title="Delete comment"
                      >
                        Delete
                      </button>
                    </div>
                    <div style={styles.commentBody}>{c.body}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside style={styles.card} aria-label="Ticket Summary">
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <div style={styles.sidebarSection}>
            <div>
              <div style={styles.label}>Status</div>
              <div>{ticket.status}</div>
            </div>
            <div>
              <div style={styles.label}>Priority</div>
              <div>{ticket.priority}</div>
            </div>
            <div>
              <div style={styles.label}>Category</div>
              <div>{ticket.category}</div>
            </div>
            <div>
              <div style={styles.label}>Assignee</div>
              <div>{ticket.assignee || <span style={styles.subtle}>Unassigned</span>}</div>
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.label}>Tags</div>
            <div style={styles.tagRow}>
              {ticket.tags.length ? (
                ticket.tags.map((t) => (
                  <span key={t} style={styles.tag}>
                    {t}
                  </span>
                ))
              ) : (
                <span style={styles.subtle}>No tags</span>
              )}
            </div>
          </div>

          <hr style={styles.divider} />

          <div style={styles.sidebarSection}>
            <div style={styles.label}>Created</div>
            <div>{fmt(ticket.createdAt)}</div>
            <div style={styles.label}>Last Updated</div>
            <div>{fmt(ticket.updatedAt)}</div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.label}>Keyboard</div>
            <div style={styles.subtle}>
              Post comment: <kbd style={styles.kbd}>Ctrl/⌘</kbd> +{" "}
              <kbd style={styles.kbd}>Enter</kbd>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
