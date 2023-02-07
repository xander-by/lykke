

const roundFuncs = () => {
    Number.prototype.round = function (places) {
      return Math.round(this * 10 ** places) / 10 ** places;
    };
    Number.prototype.floor = function (places) {
      return Math.floor(this * 10 ** places) / 10 ** places;
    };
    Number.prototype.ceil = function (places) {
      return Math.ceil(this * 10 ** places) / 10 ** places;
    };
  };

roundFuncs()
const volCorrection= (1 / 10 ** 8).round(8)
console.log(volCorrection)
console.log(volCorrection.toFixed(8).slice(-3))
