package com.eartho.one.authentication.storage;

import com.eartho.one.util.Clock;

/**
 * Default Clock implementation used for verification.
 *
 * @see Clock
 * <p>
 * This class is thread-safe.
 */
final class ClockImpl implements Clock {

    ClockImpl() {
    }

    @Override
    public long getCurrentTimeMillis() {
        return System.currentTimeMillis();
    }
}
