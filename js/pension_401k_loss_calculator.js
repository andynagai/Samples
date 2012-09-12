
window.onload = function() {


(function(window, document, undefined){


    //objects
    var my = {},
        mortTable = [],
        calcResult = {};

    //form fields
    var inp_cur_wage     = document.getElementById('cur_wage'),
        inp_cur_age      = document.getElementById('cur_age'),
        inp_retire_age   = document.getElementById('retire_age'),
        inp_hours        = document.getElementById('hours'),
        inp_cur_pen_mon  = document.getElementById('cur_pen_mon'),
        inp_cur_pen_lump = document.getElementById('cur_pen_lump'),
        inp_kai_pen_mon  = document.getElementById('kai_pen_mon'),
        inp_kai_pen_lump = document.getElementById('kai_pen_lump'),
        inp_mon_loss     = document.getElementById('mon_loss'),
        inp_lump_loss    = document.getElementById('lump_loss');



    //user input test values
    /*
    var inp_cur_rate = 26,
        inp_cur_age = 35,
        inp_retire_age  = 65,
        inp_hours_per_wk    = 40;
*/

    //constants
    var cons_ass_cont_401k = .05,
        cons_ass_wage_incr = .03,
        cons_401k_roi      = .06,
        cons_bond_yield_1  = .0157,
        cons_bond_yield_2  = .0436,
        cons_bond_yield_3  = .0518;

    makeMortTable();

    //initialize global calculated values
    var hours_per_yr    = 0,
        yrs_to_retire   = 0,
        //expected_yrs    = 19.3, //This is from Mortality table line 65 column 7
        expected_yrs    = 0,
        expected_mnths  = 0;



    //console.log(mortTable);

   my.calcLoss = function() {

        if(!_validate()) {
            return false;
        }


        //Initial calculations
        hours_per_yr    = inp_hours.value * 52;
        yrs_to_retire   = inp_retire_age.value - inp_cur_age.value;
        //expected_yrs  = 19.3, //This is from Mortality table line 65 column 7
        expected_yrs    = mortTable[inp_retire_age.value].expect,
        expected_mnths  = Math.round(expected_yrs * 12);

        calcResult = makeCalcTable();
        var intDeval = calcIntDeval();
        var lump_sum = _round(calcResult.lump_sum, 2);
        var cur_pen_mon = Math.round(calcResult.mon_pen, 2);
        var cur_pen_lump = Math.round(lump_sum-intDeval, 2);
        var kai_pen_lump = Math.round(calcResult.total_401k, 2);
        var kai_pen_mon = Math.round(calcResult.total_401k / expected_mnths, 2);

        inp_cur_pen_mon.value = _formatDollar(cur_pen_mon);
        inp_cur_pen_lump.value = _formatDollar(cur_pen_lump);
        inp_kai_pen_lump.value = _formatDollar(kai_pen_lump);
        inp_kai_pen_mon.value = _formatDollar(kai_pen_mon);
        inp_mon_loss.value = _formatDollar(cur_pen_mon - kai_pen_mon);
        inp_lump_loss.value = _formatDollar(cur_pen_lump - kai_pen_lump);
   };

   // console.log(calcResult);

    
    function makeCalcTable() {

        //initialize starting values
        var calc,
            wage_rate_total = inp_cur_wage.value,
            cont_401k = cons_ass_cont_401k * wage_rate_total * hours_per_yr,
            total_401k = cont_401k,
            pay_401k = total_401k / expected_mnths,
            past_wages = 0,
            avg_wage = 0,
            mon_pen = 0,
            lump_sum = 0,
            wage_rate = [];

        //start with current rate
        wage_rate[1] = {rate: inp_cur_wage.value};

        //Calculate running totals up to number of years remaining to retirement
        for(var x=2;x <= yrs_to_retire;x++){
           
            wage_rate_total = wage_rate_total * (1+ cons_ass_wage_incr);
            wage_rate[x] = {rate: wage_rate_total};
            cont_401k = cons_ass_cont_401k * wage_rate_total * hours_per_yr;
            total_401k = ((1 + cons_401k_roi) * total_401k) + cont_401k;
            pay_401k = total_401k / expected_mnths;

            //Calculate payout data
            if(x>4) {
                past_wages = 0;
                for(var i=x, start=x; i > start-5; i--){

                    past_wages = past_wages + wage_rate[i].rate;
                    //console.log('rate ' + i + ': ' + wage_rate[i].rate);
                }
                avg_wage = past_wages/5;
                mon_pen = avg_wage * .0145 * 173.33 * x;
                lump_sum = mon_pen * expected_mnths;
            }


        }
         calc = {year: x,
             wage_rate_total: wage_rate_total,
             wage_rate: wage_rate,
             cont_401k: cont_401k,
             total_401k: total_401k,
             pay_401k: pay_401k,
             past_wages: past_wages,
             avg_wage: avg_wage,
             mon_pen: mon_pen,
             lump_sum: lump_sum
            };
       
        return calc;
    }

    function makeMortTable() {

        mortTable = [
            {prob: 0}, {prob: .000365}, {prob: .000242}, {prob: .000192}, {prob: .000147}, {prob: .000134}, {prob: .000127}, {prob: .000121}, {prob: .00011}, {prob: .000105}, {prob: .000107},
            {prob: .000109}, {prob: .000114}, {prob: .00012}, {prob: .00013}, {prob: .000141}, {prob: .000149}, {prob: .000158}, {prob: .000164}, {prob: .000168}, {prob: .000171},
            {prob: .000176}, {prob: .000182}, {prob: .000194}, {prob: .000205}, {prob: .000219}, {prob: .000242}, {prob: .000251}, {prob: .000261}, {prob: .000273}, {prob: .000299},
            {prob: .000346}, {prob: .000391}, {prob: .000436}, {prob: .000479}, {prob: .000521}, {prob: .000561}, {prob: .000599}, {prob: .000625}, {prob: .000651}, {prob: .000684},
            {prob: .000721}, {prob: .000765}, {prob: .000815}, {prob: .000873}, {prob: .000926}, {prob: .00098}, {prob: .001037}, {prob: .001112}, {prob: .001194}, {prob: .0013},
            {prob: .001398}, {prob: .001543}, {prob: .001736}, {prob: .001959}, {prob: .002313}, {prob: .002783}, {prob: .003206}, {prob: .003666}, {prob: .004161}, {prob: .004752},
            {prob: .005519}, {prob: .006339}, {prob: .007372}, {prob: .008328}, {prob: .009415}, {prob: .010766}, {prob: .011995}, {prob: .013185}, {prob: .014598}, {prob: .015993},
            {prob: .017611}, {prob: .019619}, {prob: .02172}, {prob: .024223}, {prob: .027008}, {prob: .030005}, {prob: .033851}, {prob: .037881}, {prob: .042409}, {prob: .047487},
            {prob: .053421}, {prob: .060085}, {prob: .066869}, {prob: .07512}, {prob: .084103}, {prob: .094148}, {prob: .106403}, {prob: .119262}, {prob: .133024}, {prob: .148226},
            {prob: .162008}, {prob: .177795}, {prob: .193379}, {prob: .207446}, {prob: .22327}, {prob: .236456}, {prob: .250715}, {prob: .265075}, {prob: .276062}, {prob: .286104},
            {prob: .301731}, {prob: .313092}, {prob: .324542}, {prob: .335529}, {prob: .345501}, {prob: .353906}, {prob: .361363}, {prob: .368721}, {prob: .375772}, {prob: .382309},
            {prob: .388123}, {prob: .393008}, {prob: .396754}, {prob: .399154}, {prob: .4}, {prob: .4}, {prob: .4}, {prob: .4}, {prob: .4}, {prob: 1}
        ]
        var len = mortTable.length;
        for(var x=1; x<len; x++) {

            //calculate Number surviving to age x
            if(x==1){
                 mortTable[x].surv = 100000;
            } else {
                 mortTable[x].surv = Math.round(mortTable[x-1].surv - mortTable[x-1].dying);
            }

            //calculate Number dying between ages x to x+1
            mortTable[x].dying = Math.round(mortTable[x].prob * mortTable[x].surv);

            //calculate Person-years lived between ages x to x+1
            mortTable[x].lived = Math.round(mortTable[x].surv - mortTable[x].dying);
  
        }

        var i;
        var yrs_total = 0;
        //Iterate again to calculate the rest
        for(x=1; x<len; x++) {

            //calculate Total number person-years lived above age x
            yrs_total = 0;
            for(i=x; i<len; i++) {

                yrs_total = yrs_total + mortTable[i].lived;
            }

            mortTable[x].above = yrs_total;

            //calculate Expectation of life at age x
            mortTable[x].expect = _round(mortTable[x].above / mortTable[x].surv,1);

        }


     }

     function calcIntDeval() {

       var  seg1Calc, seg1Spot, seg1Perc, seg1LumpSum, seg1IntDeval;

       seg1Calc =  expected_yrs - 5;

       if(seg1Calc > 0) {
           seg1Spot = Math.round(expected_yrs - seg1Calc);
       } else {
           if(seg1Calc < 0) {
               seg1Spot = Math.round(expected_yrs);
           }
       }

       seg1Perc = _round(seg1Spot / expected_yrs,4);
       seg1LumpSum = calcResult.lump_sum * seg1Perc;
       seg1IntDeval = _round(cons_bond_yield_1 * seg1LumpSum, 2);

       seg2CalcA = expected_yrs - seg1Spot;
       seg2CalcB = seg2CalcA - 15;

       if(seg2CalcA <= 15) {

           seg2Spot = Math.round(seg2CalcA);

       } else {

           if(seg2CalcA > 15) {
               seg2Spot = Math.round(seg2CalcA - seg2CalcB);
           }
       }

       seg2Perc = _round(seg2Spot / expected_yrs, 4);
       seg2LumpSum = calcResult.lump_sum * seg2Perc;
       seg2IntDeval = _round(cons_bond_yield_2 * seg2LumpSum, 2);

       //Calculate the third bond yield calc
       seg3Spot = Math.round(expected_yrs - (seg1Spot + seg2Spot));
       seg3Perc = _round(seg3Spot / expected_yrs, 4);
       seg3LumpSum = calcResult.lump_sum * seg3Perc;
       seg3IntDeval = _round(cons_bond_yield_3 * seg3LumpSum, 2);

       totIntDeval = _round(seg1IntDeval + seg2IntDeval + seg3IntDeval, 2);

       /*
       console.log('seg1 calc: ' + seg1Calc);
       console.log('seg1 spot: ' + seg1Spot);
       console.log('seg1 perc: ' + seg1Perc);
       console.log('seg1 lump: ' + seg1LumpSum);
       console.log('seg1 intdeval ' + seg1IntDeval);
       
       console.log(seg2IntDeval);
       console.log('tot: ' + totIntDeval);
*/

      return totIntDeval;


     }

     //rounds number to specific decimal places.
     function _round(num, dec) {
        var multiplier = Math.pow(10, dec);
        return Math.round(num * multiplier) / multiplier;
     }

    function _formatDollar(num) {
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num)) num = "0";
        sign = (num == (num = Math.abs(num)));
        num = Math.floor(num * 100 + 0.50000000001);
        cents = num % 100;
        num = Math.floor(num / 100).toString();
        if (cents < 10) cents = "0" + cents;
        for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        return (((sign) ? '' : '-') + '$' + num);
    }

    function _validate() {
        var cur_wage    = inp_cur_wage.value,
            cur_age     = inp_cur_age.value,
            retire_age  = inp_retire_age.value,
            hours       = inp_hours.value;
        if(!cur_wage || !cur_age || !retire_age || !hours) {
            alert('You must fill in all input fields!');
            return false;
        }

        if(isNaN(cur_wage) || isNaN(cur_age) || isNaN(retire_age) || isNaN(hours)) {
            alert('All input values must be numeric!');
            return false;
        }

        if(cur_age < 18) {

            alert('You must be at least 18 years old!');
            return false;
        }

        if(hours <= 19){
            alert('You must work over 19 hours per week to qualify for the pension plan!');
            return false;
        }

        if(retire_age < 55 || retire_age > 65) {

            alert('Your retirement age must be between 55 and 65!');
            return false;
        }

        if((retire_age - cur_age) < 5) {
            
            alert('retiring in less than 5 years');
            return false;
        }

        return true;
    }

    //Does not work in IE < 9
    /*
    function _formatDollar(num) {
    var p = num.toFixed(2).split(".");
    return ["$", p[0].split("").reverse().reduce(function(acc, num, i) {
        return num + (i && !(i % 3) ? "," : "") + acc;
    })].join("");
   }
   */
window.$Lib = my;

}(this, document));

};












