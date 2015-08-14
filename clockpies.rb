#!/usr/bin/ruby -w

radius = 35

(0..11).each do |n|
  h0 = n
  h0 = 12 if h0 == 0

  h1 = (h0 + 1) % 12
  h1 = 12 if h1 == 0

  a0 = 2 * Math::PI * (h0 / 12.0);
  a1 = 2 * Math::PI * (h1 / 12.0);

  x0 = (Math.sin(a0) * radius).round
  y0 = (Math.cos(a0) * radius).round

  x1 = (Math.sin(a1) * radius).round
  y1 = (Math.cos(a1) * radius).round

  color = (n % 2 == 0) ? "silver" : "gray"
  printf(%|   <path class="slice" id=%13s d="M0,0 L%3d,%3d A%d,%d 0 0,1 %3d,%3d z" fill=%8s />\n|,
         %|"slice#{h0}to#{h1}\"|,
         x0, y0,
         radius, radius,
         x1, y1,
         %|"#{color}"|)
  #puts "   <path class=\"slice\" id=\"slice#{h0}to#{h1}\" d=\"M0,0 L#{x0},#{y0} A#{radius},#{radius} 0 0,1 #{x1},#{y1} z\" fill=\"#{color}\" />"
end
