import Events from "../js/util/Events";

/**
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


test("on(name, callback) and trigger(name)", (done) => {
    const events = new Events();

    events.on('change', (data) => {
        expect(data).toBe(1);
        done();
    });

    events.trigger('change', 1);
});

test("on('all', callback) and trigger(name)", (done) => {
    const events = new Events();

    events.on('all', (data) => {
        expect(data).toBe('change', 1);
        done();
    });

    events.trigger('change', 1);
});