import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [wishlistData, setWishlistData] = useState([]);

  useEffect(() => {
    fetch("./WishlistData.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setWishlistData(data))
      .catch((error) => {
        console.error("Error fetching wishlist data:", error);
        fetch("./WishlistData.json")
          .then((response) => response.text())
          .then((text) => console.error("Response text:", text))
          .catch((err) => console.error("Error fetching response text:", err));
      });
  }, []);

  const handleApprovalForAll = (userId, isApproved) => {
    setWishlistData((prevData) =>
      prevData.map((user) =>
        user.id === userId
          ? {
              ...user,
              wishlist: user.wishlist.map((item) => ({
                ...item,
                approved: isApproved,
              })),
            }
          : user
      )
    );
  };

  const handleDenyAll = (userId) => {
    handleApprovalForAll(userId, false);
  };

  const handleApproveAll = (userId) => {
    handleApprovalForAll(userId, true);
  };

  const styles = {
    wishlistItem: {
      backgroundColor: "lightgreen",
    },
    item: {
      marginRight: "10px",
    },
    button: {
      marginLeft: "10px",
      padding: "5px 10px",
      border: "none",
      cursor: "pointer",
    },
    approve: {
      backgroundColor: "green",
      color: "white",
    },
    deny: {
      backgroundColor: "red",
      color: "white",
    },
    status: {
      marginLeft: "10px",
    },
    userContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
    },
    wishlistContainer: {
      flex: 1,
      marginRight: "20px",
    },
  };

  return (
    <div>
      <h1>Wishlist Submissions - Active</h1>
      {wishlistData.map((user) => (
        <div key={user.id} style={styles.userContainer}>
          <div style={styles.wishlistContainer}>
            <h2>
              {user.name} - {user.location} - Age: {user.age}
            </h2>
            <ul>
              {user.wishlist.map((item) => (
                <li key={item.id} style={styles.wishlistItem}>
                  <span style={styles.item}>{item.item}</span>
                  <span style={styles.status}>
                    {item.approved ? "Approved" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <button
              onClick={() => handleApproveAll(user.id)}
              disabled={user.wishlist.every((item) => item.approved)}
              style={{ ...styles.button, ...styles.approve }}
            >
              Approve All
            </button>
            <button
              onClick={() => handleDenyAll(user.id)}
              style={{ ...styles.button, ...styles.deny }}
            >
              Deny All
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;