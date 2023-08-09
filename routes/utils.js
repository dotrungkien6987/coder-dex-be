const utilsHelper = {};
utilsHelper.findClosestNumbers=(numbers, target)=> {
  // Sắp xếp mảng
  numbers.sort(function (a, b) {
    return a - b;
  });

  let previous = null;
  let next = null;

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === target) {
      if (i === 0) {
        previous = numbers[numbers.length - 1];
        next = numbers[i + 1];
      } else if (i === numbers.length - 1) {
        previous = numbers[i - 1];
        next = numbers[0];
      } else {
        previous = numbers[i - 1];
        next = numbers[i + 1];
      }
      break;
    }
    if (numbers[i] > target) {
      next = numbers[i];
      previous = numbers[i - 1];
      break;
    }
  }

  return {
    previous: previous,
    next: next,
  };
}
module.exports = utilsHelper;