package dev.cheneyni.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {

    @Min(value = 0, message = "userId cannot be negative")
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private long userId;

    @NotBlank(message = "email is required")
    @Size(max = 254, message = "email must be shorter than 255 characters")
    @Email(regexp = ".+@.{2,}\\..{2,}", message = "email must be a valid email address")
    @Column(name = "email")
    private String email;

    @NotBlank(message = "username is required")
    @Size(max = 50, message = "username cannot be greater than 50 characters")
    private String username;

    @NotBlank(message = "password is required")
    @Size(min = 8, message = "password must have at least 8 characters")
    private String password;

    private LocalDateTime createdAt;

    public User() {}

    public User(int userId, String email, String username, String password) {
        this.userId = userId;
        this.email = email;
        this.username = username;
        this.password = password;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        User user = (User) o;
        return userId == user.userId && Objects.equals(email, user.email)
            && Objects.equals(username, user.username) && Objects.equals(
            password, user.password) && Objects.equals(createdAt, user.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, email, username, password, createdAt);
    }

    @Override
    public String toString() {
        return "User{" +
            "userId=" + userId +
            ", email='" + email + '\'' +
            ", username='" + username + '\'' +
            ", createdAt=" + createdAt +
            '}';
    }
}
