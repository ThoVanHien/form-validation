//constructor function
function Validator(option) {
  function getParent(element, selector) {
    while (element) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  var selectorRules = {};

  function validate(inputElement, rule) {
    //Lấy ra element message lỗi

    var errorElement = getParent(
      inputElement,
      option.formGroupSelector
    ).querySelector(option.errorSelector);

    //value : inputElement.value
    //test func : rule.test
    var errorMessage;

    //Lấy ra các rules của selector
    var rules = selectorRules[rule.selector];

    //Lặp qua từng rule & kiểm tra
    //Nếu có lỗi thì dừng việc kiểm tra
    for (var i = 0; i < rules.length; ++i) {
      switch (inputElement.type) {
        case "radio":
        case "checkbox":
          errorMessage = rules[i](
            formElement.querySelector(rule.selector) + ":checked"
          );
          break;
        default:
          errorMessage = rules[i](inputElement.value);
      }
      if (errorMessage) break;
    }
    if (errorMessage) {
      errorElement.innerText = errorMessage;
      getParent(inputElement, option.formGroupSelector).classList.add(
        "invalid"
      );
    }
    //Ngược lại nếu nhập thì bỏ trống lỗi
    else {
      errorElement.innerText = "";
      getParent(inputElement, option.formGroupSelector).classList.remove(
        "invalid"
      );
    }
    return !errorMessage;
  }

  //Lấy được element form
  var formElement = document.querySelector(option.form);

  //Chặn submit và validate tất cả các field
  if (formElement) {
    formElement.onsubmit = function (e) {
      e.preventDefault();
      var isformValid = true;

      //Lặp qua từng rules và validate
      option.rules.forEach(function (rule) {
        var inputElement = formElement.querySelector(rule.selector);
        var isValid = validate(inputElement, rule);
        if (!isValid) {
          isformValid = false;
        }
      });

      if (isformValid) {
        //Trường hợp Submit với JS
        if (typeof option.onSubmit === "function") {
          var enableInputs = formElement.querySelectorAll("[name]");
          var formValues = Array.from(enableInputs).reduce(function (
            values,
            input
          ) {
            switch (input.type) {
              case "radio":
                values[input.name] = formElement.querySelector(
                  'input[name="' + input.name + '"]:checked'
                ).value;
                break;
              case "checkbox":
                if (!input.matches(":checked")) {
                  values[input.name] = "";
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);

                break;
              case "file":
                values[input.name] = input.files;
                break;
              default:
                values[input.name] = input.value;
            }
            return values;
          },
          {});

          option.onSubmit(formValues);
        }

        //Trường hợp submit với hành vi mặc định
        else {
          formElement.submit();
        }
      }
    };

    //Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input...)
    option.rules.forEach(function (rule) {
      //Lưu lại các rules cho mỗi input
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }

      var inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach(function (inputElement) {
        //xử lý trường hợp blur khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule);
        };

        //xử lý trường hợp mỗi khi người dùng nhập vào input
        inputElement.oninput = function () {
          var errorElement = getParent(
            inputElement,
            option.formGroupSelector
          ).querySelector(option.errorSelector);
          errorElement.innerText = "";
          getParent(inputElement, option.formGroupSelector).classList.remove(
            "invalid"
          );
        };

        //Xử lý onchange
      });
    });
  }
}

//Định nghĩa rules
//Nguyên tắc của các rules:
//1.Khi có lỗi => trả mess lỗi
//2.Khi hợp lệ => không trả ra cái gì cả (undifined)
Validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      return value ? undefined : message || "Vui lòng nhập trường này";
    },
  };
};

Validator.isEmail = function (selector, message) {
  return {
    selector: selector,
    test: function (value) {
      const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(value)
        ? undefined
        : message || "Vui lòng nhập đúng định dạng email";
    },
  };
};

Validator.minLength = function (selector, min, message) {
  return {
    selector: selector,
    test: function (value) {
      return value.length >= min
        ? undefined
        : message || `Vui lòng nhập ${min} ký tự`;
    },
  };
};

Validator.isConfirmed = function (selector, getConfirmValue, message) {
  return {
    selector: selector,
    test: function (value) {
      return value === getConfirmValue()
        ? undefined
        : message || "Không khớp mật khẩu";
    },
  };
};
