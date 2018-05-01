#include "emscripten/bind.h"

using namespace emscripten;

class Foo {
 public:
  Foo(std::string name, unsigned id) : name_(name), id_(id) {}
  std::string GetName () const { return name_; }
  unsigned GetId() const { return id_; }
  void SetId(unsigned id) { id_ = id; }

 private:
  std::string name_;
  unsigned id_;
};

EMSCRIPTEN_BINDINGS(CLASS_FOO) {
  class_<Foo>("Foo")
    .constructor<std::string, unsigned>()
    .function("getName", &Foo::GetName)
    .property("id", &Foo::GetId, &Foo::SetId);
}
