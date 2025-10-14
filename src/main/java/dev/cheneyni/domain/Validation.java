package dev.cheneyni.domain;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;

public class Validation {

    public static <T> Result<T> validateService(T object) {
        Validator validator;
        try (ValidatorFactory factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
        Set<ConstraintViolation<T>> violations = validator.validate(object);

        Result<T> result = new Result<>();
        violations.forEach(violation ->
            result.addMessage(violation.getMessage(), ResultType.INVALID));

        return result;
    }
}
