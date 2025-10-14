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

    public Result<User> createUser(User user) {
        Result<User> result = Validation.validateService(user);
        if (user.getUserId() != 0) {
            result.addMessage("userId cannot be set for create operation", ResultType.INVALID);
        }

        if (repository.findByEmail(user.getEmail()) != null) {
            result.addMessage(String.format("Email '%s' is already in use.", user.getEmail()), ResultType.INVALID);
        }

        if (!result.isSuccess()) {
            return result;
        }

        User newUser = repository.save(user);
        result.setData(newUser);
        return result;
    }
}
