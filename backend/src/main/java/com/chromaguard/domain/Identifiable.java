package com.chromaguard.domain;

/**
 * Generic contract for domain entities possessing a unique identifier.
 * Demonstrates Java Generics with parameterized identifier type {@code ID}.
 *
 * @param <ID> the type of the entity's primary key
 */
public interface Identifiable<ID> {

    /**
     * Returns the unique identity of this domain object.
     *
     * @return primary identifier
     */
    ID getId();
}
