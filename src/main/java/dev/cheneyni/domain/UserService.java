package dev.cheneyni.domain;

import dev.cheneyni.data.UserRepository;
import dev.cheneyni.models.User;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User findByEmail(String email) {
        return repository.findByEmail(email);
    }
}
